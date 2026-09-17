interface Token {
   readonly text: string;
   readonly kind: "word" | "string" | "punctuation";
   readonly start: number;
   readonly end: number;
}

function syntax(message: string, offset: number): never {
   throw new SyntaxError(`Fortenv: ${message} (config offset ${offset}).`);
}

function quotedEnd(source: string, start: number): number {
   const quote = source[start];
   for (let index = start + 1; index < source.length; index++) {
      if (source[index] === "\\") {
         index++;
         continue;
      }
      if (source[index] === quote) return index + 1;
      if (quote === "`" && source.slice(index, index + 2) === "${") {
         syntax("template interpolation is unsupported in declarative config", index);
      }
   }
   return syntax("unterminated string", start);
}

/** Decode identifier characters for classification, preserving source offsets for rewriting. */
function readIdentifier(source: string, start: number): { end: number; name: string } {
   let index = start;
   let name = "";
   while (index < source.length) {
      let character = String.fromCodePoint(source.codePointAt(index)!);
      let width = character.length;
      const escaped = character === "\\";
      if (escaped) {
         const escape = /^\\u(?:([\da-fA-F]{4})|\{([\da-fA-F]+)\})/.exec(source.slice(index));
         if (!escape) syntax("invalid Unicode escape in identifier", index);
         const point = Number.parseInt(escape[1] ?? escape[2]!, 16);
         if (point > 0x10ffff) syntax("invalid Unicode code point in identifier", index);
         character = String.fromCodePoint(point);
         width = escape[0].length;
      }
      const allowed = index === start ? /[$_\p{ID_Start}]/u : /[$\u200c\u200d\p{ID_Continue}]/u;
      if (!allowed.test(character)) {
         if (escaped) syntax("invalid escaped identifier character", index);
         break;
      }
      name += character;
      index += width;
   }
   return { end: index, name };
}

/** A lexer for import rewriting, not a parser for config objects or general JS. */
function tokenize(source: string): Token[] {
   const tokens: Token[] = [];
   let index = source.startsWith("#!") ? source.indexOf("\n") : 0;
   if (index < 0) return tokens;
   while (index < source.length) {
      const start = index;
      const character = String.fromCodePoint(source.codePointAt(index)!);
      if (/\s/u.test(character)) {
         index++;
         continue;
      }
      if (source.startsWith("//", index)) {
         const end = source.indexOf("\n", index + 2);
         index = end < 0 ? source.length : end;
         continue;
      }
      if (source.startsWith("/*", index)) {
         const end = source.indexOf("*/", index + 2);
         if (end < 0) syntax("unterminated comment", index);
         index = end + 2;
         continue;
      }
      let kind: Token["kind"] = "punctuation";
      if (character === '"' || character === "'" || character === "`") {
         index = quotedEnd(source, index);
         kind = "string";
      } else if (character === "\\" || /[$_\p{ID_Start}]/u.test(character)) {
         const identifier = readIdentifier(source, index);
         index = identifier.end;
         if (identifier.name.startsWith("__fortenv_")) {
            syntax("identifiers starting with __fortenv_ are reserved", start);
         }
         kind = "word";
      } else {
         if (character === "/") {
            syntax("regular expressions and division are unsupported in declarative config", index);
         }
         index += character.length;
      }
      const text = source.slice(start, index);
      tokens.push({ text, kind, start, end: index });
   }
   return tokens;
}

class ImportDeclaration {
   private index: number;
   private readonly bindings: string[] = [];
   private namespace: string | undefined;

   constructor(
      private readonly tokens: readonly Token[],
      start: number,
   ) {
      this.index = start + 1;
   }

   private token(): Token {
      const token = this.tokens[this.index];
      if (!token) syntax("incomplete import declaration", this.tokens.at(-1)?.end ?? 0);
      return token;
   }

   private take(text: string): boolean {
      if (this.tokens[this.index]?.text !== text) return false;
      this.index++;
      return true;
   }

   private expect(text: string): void {
      if (!this.take(text)) syntax(`expected '${text}' in import declaration`, this.token().start);
   }

   private identifier(): string {
      const token = this.token();
      if (token.kind !== "word") syntax("expected an imported binding name", token.start);
      this.index++;
      return token.text;
   }

   private namedBindings(): void {
      while (!this.take("}")) {
         const exported = this.token();
         if (exported.kind !== "word" && exported.kind !== "string") {
            syntax("expected an export name", exported.start);
         }
         this.index++;
         const local = this.take("as") ? this.identifier() : exported.text;
         if (exported.kind === "string" && local === exported.text) {
            syntax("quoted export names require an alias", exported.start);
         }
         this.bindings.push(`${exported.text}: ${local}`);
         if (!this.take(",")) {
            this.expect("}");
            return;
         }
      }
   }

   private clause(): void {
      if (this.token().kind === "word") {
         this.bindings.push(`default: ${this.identifier()}`);
         if (!this.take(",")) return;
      }
      if (this.take("*")) {
         this.expect("as");
         this.namespace = this.identifier();
      } else {
         this.expect("{");
         this.namedBindings();
      }
   }

   read(id: number): { endIndex: number; source: string } {
      if (this.token().kind !== "string") {
         this.clause();
         this.expect("from");
      }
      const specifier = this.token();
      if (specifier.kind !== "string" || specifier.text.startsWith("`")) {
         syntax("import specifiers must be quoted strings", specifier.start);
      }
      this.index++;
      const next = this.tokens[this.index];
      if (next?.text === "with" || next?.text === "assert") {
         syntax("import attributes are unsupported in config", next.start);
      }
      this.take(";");
      const module = `__fortenv_module${id}`;
      const statements = [`const ${module} = (await __fortenv_import(${specifier.text})).namespace;`];
      if (this.bindings.length) statements.push(`const { ${this.bindings.join(", ")} } = ${module};`);
      if (this.namespace) statements.push(`const ${this.namespace} = ${module};`);
      return { endIndex: this.index - 1, source: statements.join("\n") };
   }
}

/** Rewrite static imports into mock-loader calls and capture the default export. */
export function transformImports(source: string): string {
   const tokens = tokenize(source);
   const imports: string[] = [];
   const body: string[] = [];
   let cursor = 0;
   let depth = 0;
   let defaults = 0;
   for (let index = 0; index < tokens.length; index++) {
      const token = tokens[index]!;
      const property = tokens[index - 1]?.text === ".";
      if (depth === 0 && token.kind === "word" && !property) {
         if (token.text === "import") {
            const declaration = new ImportDeclaration(tokens, index).read(imports.length);
            imports.push(declaration.source);
            body.push(source.slice(cursor, token.start));
            index = declaration.endIndex;
            cursor = tokens[index]!.end;
            continue;
         }
         if (token.text === "export") {
            if (tokens[index + 1]?.text !== "default" || defaults++) {
               syntax("config must have one default export and no re-exports or named exports", token.start);
            }
            body.push(source.slice(cursor, token.start), "const __fortenv_default =");
            cursor = tokens[++index]!.end;
            continue;
         }
      }
      if (token.kind === "punctuation") {
         if ("{([".includes(token.text)) depth++;
         if ("})]".includes(token.text)) depth--;
      }
   }
   if (defaults !== 1) syntax("config must have a default export", 0);
   body.push(source.slice(cursor));
   // Hoist all imports, including declarations placed after the default export.
   const contents = body.join("").replace(/^#![^\n]*/, "");
   return `${imports.join("\n")}\n${contents}\n;return __fortenv_default;`;
}
