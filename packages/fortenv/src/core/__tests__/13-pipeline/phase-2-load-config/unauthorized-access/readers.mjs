import { fortenv } from "fortenv";

console.log("before-secret-read");
export const ambientValue = process.env.DATABASE_URL;
console.log("after-secret-read");

// Listing this function in the config does not authorize the module's direct read.
export const read = fortenv.string(({ DATABASE_URL }) => DATABASE_URL);
