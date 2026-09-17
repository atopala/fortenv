import { createContext, Script } from "node:vm";

/** Execute already-transformed source with the supplied discovery import loader. */
export async function executeSyntheticConfig(
   transformed: string,
   filename: string,
   importModule: (specifier: string) => { namespace: object },
): Promise<unknown> {
   // The VM catches accidental ambient access; it is not a hostile-code sandbox.
   const context = createContext(
      { __fortenv_import: importModule },
      {
         codeGeneration: { strings: false, wasm: false },
      },
   );
   const script = new Script(`(async () => { "use strict";\n${transformed}\n})()`, {
      filename,
      // No native dynamic-import callback: dependencies must remain mocked.
   });
   return await script.runInContext(context, { timeout: 1000 });
}
