import { fortenv } from 'fortenv';

export const read = fortenv.string(({ DATABASE_URL }) => DATABASE_URL);
export const readStripe = fortenv.string(({ STRIPE_SECRET_KEY }) => STRIPE_SECRET_KEY);
export { read as default, read as 'database-reader', read as then };
