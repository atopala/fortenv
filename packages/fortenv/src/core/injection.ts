import { createNullPrototypeRecord, forEachSetValue, freezeRecord, readMap } from "./intrinsics.js";

/**
 * Augment this interface with your secret key names to enable global typing of the
 * default `fortenv` instance. Each key should have type `unknown` — only the key name
 * matters. Values are always `string | undefined` at runtime regardless of what you
 * declare here.
 *
 * @example
 * // fortenv.d.ts
 * declare module "@fortenv/core" {
 *   interface FortenvSecretKeys {
 *     DATABASE_URL: unknown;
 *     STRIPE_SECRET_KEY: unknown;
 *   }
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface FortenvSecretKeys {}

/**
 * The union of configured secret key names. Equals `string` when `FortenvSecretKeys`
 * is unaugmented (preserving the loose default), or the union of augmented key names
 * when the app declares them. Used as the default type parameter for the `fortenv`
 * instance.
 */
export type FortenvSecrets = keyof FortenvSecretKeys extends never ? string : keyof FortenvSecretKeys;

/** Runtime config determines which own keys are present; values may be absent. */
export type SecretValues<Keys extends string = string> = Readonly<Record<Keys, string | undefined>>;

/** Copy only this wrapper's grants. Never hand the backing store to application code. */
export function injectSecrets(
   names: ReadonlySet<string>,
   values: ReadonlyMap<string, string | undefined>,
   normalize: (name: string) => string = (name) => name,
): SecretValues {
   const secrets = createNullPrototypeRecord<string | undefined>();
   forEachSetValue(names, (name) => {
      secrets[name] = readMap(values, normalize(name));
   });
   return freezeRecord(secrets);
}
