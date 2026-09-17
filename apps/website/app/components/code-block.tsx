import type { ReactNode } from "react";

type Language = "javascript" | "shell" | "typescript";

type CodeBlockProps = {
   code: string;
   language?: Language;
};

type TokenType =
   | "command"
   | "comment"
   | "constant"
   | "function"
   | "keyword"
   | "literal"
   | "number"
   | "operator"
   | "option"
   | "string"
   | "variable";

const javascriptPattern =
   /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(`(?:\\[\s\S]|[^\\`])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b(?:abstract|as|async|await|break|case|catch|class|const|continue|debugger|declare|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|of|private|protected|public|readonly|return|satisfies|set|static|super|switch|throw|try|type|typeof|var|void|while|with|yield)\b)|(\b(?:false|null|true|undefined)\b)|(\b\d+(?:\.\d+)?\b)|(\b[A-Z][A-Z0-9_]+\b)|(\b[A-Za-z_$][\w$]*(?=\s*\())|([{}[\]();,.?:=+\-*<>|&!]+)/g;

const shellPattern =
   /(#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\$[A-Za-z_][\w]*|\$\{[^}]+\})|(--?[A-Za-z][\w-]*)|(\b(?:node|npm|npx|pnpm)\b)/g;

const javascriptTypes: Array<TokenType> = [
   "comment",
   "string",
   "keyword",
   "literal",
   "number",
   "constant",
   "function",
   "operator",
];

const shellTypes: Array<TokenType> = ["comment", "string", "variable", "option", "command"];

function getTokenType(match: RegExpExecArray, types: Array<TokenType>): TokenType {
   const captureIndex = match.slice(1).findIndex((capture) => capture !== undefined);
   return types[captureIndex] ?? "operator";
}

function highlight(code: string, language: Language): ReactNode[] {
   const pattern = language === "shell" ? shellPattern : javascriptPattern;
   const types = language === "shell" ? shellTypes : javascriptTypes;
   const nodes: ReactNode[] = [];
   let cursor = 0;
   let tokenIndex = 0;

   pattern.lastIndex = 0;

   for (const match of code.matchAll(pattern)) {
      const index = match.index;

      if (index > cursor) {
         nodes.push(code.slice(cursor, index));
      }

      const type = getTokenType(match, types);
      nodes.push(
         <span className={`syntax-${type}`} key={`${index}-${tokenIndex}`}>
            {match[0]}
         </span>,
      );

      cursor = index + match[0].length;
      tokenIndex += 1;
   }

   if (cursor < code.length) {
      nodes.push(code.slice(cursor));
   }

   return nodes;
}

export function CodeBlock({ code, language = "typescript" }: CodeBlockProps) {
   return (
      <pre className="code-block" data-language={language}>
         <code>{highlight(code, language)}</code>
      </pre>
   );
}
