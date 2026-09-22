import { describe, expect, expectTypeOf, it } from "vitest";

import { Fortenv, fortenv, type SecretValues } from "../../../index.js";

describe("12 — Public injection types", () => {
   it("infers secret values and removes the injected argument from the caller signature", () => {
      const create = fortenv.string(({ DATABASE_URL }: SecretValues<"DATABASE_URL">, count: number, label?: string) => {
         expectTypeOf(DATABASE_URL).toEqualTypeOf<string | undefined>();
         return { count, label };
      });
      expectTypeOf(create).parameters.toEqualTypeOf<[count: number, label?: string]>();
      expectTypeOf(create).returns.toEqualTypeOf<{ count: number; label: string | undefined }>();
   });
   it("preserves generic business arguments, this and async results", () => {
      const identity = fortenv.string(<T>(_secrets: SecretValues, value: T): T => value);
      // Checked by tsc without invoking an uninitialized wrapper.
      const check = () => {
         const number = identity(42 as const);
         const string = identity("value" as const);
         expectTypeOf(number).toEqualTypeOf<42>();
         expectTypeOf(string).toEqualTypeOf<"value">();
      };
      expect(check).toBeTypeOf("function");
      const read = fortenv.string(async function (
         this: { id: number },
         { DATABASE_URL }: SecretValues<"DATABASE_URL">,
      ) {
         return { id: this.id, url: DATABASE_URL };
      });
      expectTypeOf(read).thisParameter.toEqualTypeOf<{ id: number }>();
      expectTypeOf(read).returns.toEqualTypeOf<Promise<{ id: number; url: string | undefined }>>();
   });
   it("types secret keys through a Fortenv instance", () => {
      // Instance-typed style: keys bound on the instance, business args and result inferred.
      const create = new Fortenv<"DATABASE_URL">().string(({ DATABASE_URL }, poolSize: number) => {
         expectTypeOf(DATABASE_URL).toEqualTypeOf<string | undefined>();
         return poolSize;
      });
      expectTypeOf(create).parameters.toEqualTypeOf<[poolSize: number]>();
      expectTypeOf(create).returns.toEqualTypeOf<number>();
   });
   it("rejects wrapper use before bootstrap and unsupported callback kinds", () => {
      const read = fortenv.string(() => {
         throw new Error("callback must not execute");
      });
      expect(() => read()).toThrow("not initialized");
      expect(() =>
         fortenv.string(function* () {
            yield 1;
         }),
      ).toThrow("not a generator");
      expect(() =>
         fortenv.string(async function* () {
            yield 1;
         }),
      ).toThrow("not a generator");
      expect(() => Reflect.construct(read, [])).toThrow(TypeError);
      const ordinary = fortenv.string(function () {
         return 1;
      });
      expect(() => Reflect.construct(ordinary, [])).toThrow("cannot be used as constructors");
   });
});
