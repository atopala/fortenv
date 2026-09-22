import { createNullPrototypeRecord, forEachSetValue, freezeRecord, readMap } from "./intrinsics.js";

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
