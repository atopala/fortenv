import { fortenv } from "@fortenv/core";

export const readSecret = fortenv.string(({ DATABASE_URL }) => DATABASE_URL);
