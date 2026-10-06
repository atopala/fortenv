import { fortenv } from "@fortenv/secrets";

export const ambient = process.env.DATABASE_URL;
export const read = fortenv.string(({ DATABASE_URL }) => DATABASE_URL);
