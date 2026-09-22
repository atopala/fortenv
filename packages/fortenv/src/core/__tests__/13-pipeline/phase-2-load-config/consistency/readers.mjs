import { fortenv } from "fortenv";

export const read = fortenv.string(({ DATABASE_URL }) => DATABASE_URL);
