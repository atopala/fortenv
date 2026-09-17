import assert from "node:assert/strict";

import { fortenv } from "fortenv";

export class Db {
   readonly url: string | undefined;
   readonly poolSize: number;
   constructor(url: string | undefined, poolSize: number) {
      this.url = url;
      this.poolSize = poolSize;
      // A third-party constructor receives only the value explicitly handed to it.
      assert.throws(() => process.env.DATABASE_URL, /unauthorized access/);
      assert.throws(() => process.env.OTHER_SECRET, /unauthorized access/);
   }
}
export const createDb = fortenv(({ DATABASE_URL }, poolSize: number = 10) => new Db(DATABASE_URL, poolSize));
export const snapshot = fortenv((secrets) => secrets);
export const unregistered = fortenv((secrets) => secrets);
export const echo = fortenv((secrets, value: unknown) => ({ secrets, value }));
export const result = fortenv((_secrets, value: unknown) => value);
export const later = fortenv(async (secrets, wait: Promise<void>) => {
   await wait;
   return secrets;
});
export const fail = fortenv((_secrets, error: Error) => {
   throw error;
});
export const outer = fortenv((secrets) => {
   const error = new Error("inner");
   assert.throws(
      () => fail(error),
      (caught) => caught === error,
   );
   assert.deepEqual(Object.keys(unregistered()), []);
   return secrets;
});
export const captured = fortenv((secrets, done: (value: unknown) => void, outcome: string) => {
   setImmediate(() => {
      assert.throws(() => process.env.DATABASE_URL, /unauthorized access/);
      done(secrets.DATABASE_URL);
   });
   if (outcome === "throw") throw new Error("fixture failure");
   if (outcome === "reject") return Promise.reject(new Error("fixture failure"));
   if (outcome === "resolve") return Promise.resolve(secrets.DATABASE_URL);
   return secrets.DATABASE_URL;
});
