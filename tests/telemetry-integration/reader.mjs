import { fortenv } from "@fortenv/secrets";

export const readSecret = fortenv.string(({ DATABASE_URL }) => DATABASE_URL);
