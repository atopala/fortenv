import { fortenv } from "fortenv";

try {
   void process.env.DATABASE_URL;
} catch {
   console.log("denial-caught");
}

export const read = fortenv(({ DATABASE_URL }) => DATABASE_URL);
