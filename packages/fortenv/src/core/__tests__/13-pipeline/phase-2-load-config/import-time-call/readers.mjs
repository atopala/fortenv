import { fortenv } from "fortenv";

export const read = fortenv.string(({ DATABASE_URL }) => DATABASE_URL);

// Calling before real registration is intentionally rejected; define factories here, call from the app.
export const initializedValue = read();
