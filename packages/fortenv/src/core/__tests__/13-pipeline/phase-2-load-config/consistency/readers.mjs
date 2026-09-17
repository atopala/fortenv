import { fortenv } from "fortenv";

export const read = fortenv(({ DATABASE_URL }) => DATABASE_URL);
