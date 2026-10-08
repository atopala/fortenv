import { fortenv } from "@fortenv/core";

export const read = fortenv.string(({ DATABASE_URL }) => DATABASE_URL);
