import { fortenv } from "fortenv";

// Authorized for whatever it is granted. Reports which secrets it actually received.
export const authorized = fortenv.string(
   /** @param {import("fortenv").SecretValues<"DATABASE_URL" | "SECRET_TWO">} secrets */
   (secrets) => ({
      sawDatabase: secrets.DATABASE_URL === "fake-hardening-database",
      sawSecretTwo: secrets.SECRET_TWO === "fake-hardening-secret-two",
   }),
);
