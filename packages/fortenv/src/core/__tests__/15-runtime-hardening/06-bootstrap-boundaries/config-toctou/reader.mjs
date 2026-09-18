import { fortenv } from "fortenv";

// Authorized for whatever it is granted. Reports which secrets it actually received.
export const authorized = fortenv(
   /** @param {import("fortenv").SecretValues} secrets */
   (secrets) => ({
      sawDatabase: secrets.DATABASE_URL === "fake-hardening-database",
      sawSecretTwo: secrets.SECRET_TWO === "fake-hardening-secret-two",
   }),
);
