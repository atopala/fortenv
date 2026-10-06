import { fortenv } from "@fortenv/secrets";
const registered = fortenv.string(({ DATABASE_URL }) => DATABASE_URL);
const unregistered = fortenv.string((secrets) => secrets);
export { registered, unregistered };
