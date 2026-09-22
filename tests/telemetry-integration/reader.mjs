import { fortenv } from "fortenv";

export const readSecret = fortenv.string(({ DATABASE_URL }) => DATABASE_URL);
