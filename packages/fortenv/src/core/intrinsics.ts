// Capture only security-sensitive operations before real config dependencies load.
const reflectApply = Reflect.apply;
const objectCreate = Object.create;
const objectFreeze = Object.freeze;
const mapGet = Map.prototype.get;
const weakMapGet = WeakMap.prototype.get;

export function createNullPrototypeRecord<Value>(): Record<string, Value> {
   return reflectApply(objectCreate, Object, [null]);
}

export function freezeRecord<Value>(value: Record<string, Value>): Readonly<Record<string, Value>> {
   return reflectApply(objectFreeze, Object, [value]);
}

export function readMap<K, V>(map: ReadonlyMap<K, V>, key: K): V | undefined {
   return reflectApply(mapGet, map, [key]);
}

export function readWeakMap<K extends WeakKey, V>(map: WeakMap<K, V>, key: K): V | undefined {
   return reflectApply(weakMapGet, map, [key]);
}
