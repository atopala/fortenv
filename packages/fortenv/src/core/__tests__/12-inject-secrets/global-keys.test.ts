import { describe, expectTypeOf, it } from "vitest";

import { Fortenv, fortenv, type FortenvSecrets, type SecretValues } from "../../../index.js";

// Augment FortenvSecretKeys for this compilation unit only.
declare module "../../../index.js" {
   interface FortenvSecretKeys {
      DATABASE_URL: unknown;
      STRIPE_SECRET_KEY: unknown;
   }
}

describe("12 — FortenvSecretKeys global typing", () => {
   it("FortenvSecrets narrows to the augmented key union", () => {
      expectTypeOf<FortenvSecrets>().toEqualTypeOf<"DATABASE_URL" | "STRIPE_SECRET_KEY">();
   });

   it("default fortenv instance types s with all augmented keys", () => {
      fortenv.string((s) => {
         expectTypeOf(s).toEqualTypeOf<SecretValues<"DATABASE_URL" | "STRIPE_SECRET_KEY">>();
         expectTypeOf(s.DATABASE_URL).toEqualTypeOf<string | undefined>();
         expectTypeOf(s.STRIPE_SECRET_KEY).toEqualTypeOf<string | undefined>();
      });
   });

   it("per-wrapper narrowing via param annotation still overrides the global keys", () => {
      fortenv.string((s: SecretValues<"DATABASE_URL">) => {
         expectTypeOf(s).toEqualTypeOf<SecretValues<"DATABASE_URL">>();
         // @ts-expect-error — STRIPE_SECRET_KEY not in the narrowed type
         void s.STRIPE_SECRET_KEY;
      });
   });

   it("per-wrapper narrowing via Fortenv instance still overrides the global keys", () => {
      new Fortenv<"DATABASE_URL">().string((s) => {
         expectTypeOf(s).toEqualTypeOf<SecretValues<"DATABASE_URL">>();
         // @ts-expect-error — STRIPE_SECRET_KEY not in the narrowed type
         void s.STRIPE_SECRET_KEY;
      });
   });
});
