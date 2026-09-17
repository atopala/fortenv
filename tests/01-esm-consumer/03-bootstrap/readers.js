import { fortenv } from "fortenv";
const registered = fortenv(({ DATABASE_URL }) => DATABASE_URL);
const unregistered = fortenv((secrets) => secrets);
export { registered, unregistered };
