import { fortenv } from "fortenv";

export const readSecret = fortenv(({ DATABASE_URL }) => DATABASE_URL);
