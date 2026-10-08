import { fortenv } from "@fortenv/core";

try {
   void process.env.DATABASE_URL;
} catch {
   console.log("denial-caught");
}

export const read = fortenv.string(({ DATABASE_URL }) => DATABASE_URL);
