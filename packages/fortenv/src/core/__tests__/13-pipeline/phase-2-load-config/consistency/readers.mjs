import { fortenv } from "@fortenv/secrets";

export const read = fortenv.string(({ DATABASE_URL }) => DATABASE_URL);
