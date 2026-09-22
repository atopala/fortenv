import { fortenv } from "fortenv";
const registered = fortenv.string(({ DATABASE_URL }) => DATABASE_URL);
const unregistered = fortenv.string((secrets) => secrets);
export { registered, unregistered };
