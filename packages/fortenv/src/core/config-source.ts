import { readdir, readFile, realpath } from "node:fs/promises";
import { extname, resolve } from "node:path";

import { FortenvConfigError } from "./security-errors.js";

const extensions = [".ts", ".mts", ".js", ".mjs"];

export async function configPath(directory = process.cwd(), override = process.env.FORTENV_CONFIG): Promise<string> {
   if (override !== undefined) {
      if (!override || !extensions.includes(extname(override))) {
         throw new FortenvConfigError("Fortenv: FORTENV_CONFIG must name a .ts, .mts, .js, or .mjs file.");
      }
      return realpath(resolve(directory, override));
   }
   const files = await readdir(directory);
   const matches = extensions.map((extension) => `fortenv.config${extension}`).filter((name) => files.includes(name));
   if (matches.length !== 1) {
      throw new FortenvConfigError(
         "Fortenv: expected exactly one fortenv.config.ts/.mts/.js/.mjs in the working directory; use FORTENV_CONFIG to select a file.",
      );
   }
   return realpath(resolve(directory, matches[0]!));
}

/** Read source only; importing the selected file is a later pipeline stage. */
export async function readConfigSource(filename: string): Promise<string> {
   return readFile(filename, "utf8");
}
