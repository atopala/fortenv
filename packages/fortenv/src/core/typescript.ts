import { stripTypeScriptTypes } from "node:module";

/** Strip erasable TypeScript; JavaScript source is returned unchanged. */
export function stripConfigTypes(source: string, filename: string): string {
   return /\.m?ts$/.test(filename) ? stripTypeScriptTypes(source, { mode: "strip" }) : source;
}
