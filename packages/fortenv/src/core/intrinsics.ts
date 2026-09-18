// Capture only security-sensitive operations before real config dependencies load.
import { isGeneratorFunction as nodeIsGeneratorFunction } from "node:util/types";

const isGeneratorFunctionRef = nodeIsGeneratorFunction;
const reflectApply = Reflect.apply;
const reflectOwnKeys = Reflect.ownKeys;
const jsonStringify = JSON.stringify;
const arrayIsArray = Array.isArray;
const arrayIterator = Array.prototype[Symbol.iterator];
const arrayIteratorNext: <Value>(this: Iterator<Value, undefined>) => IteratorResult<Value, undefined> =
   Object.getPrototypeOf([][Symbol.iterator]()).next;
const arrayPush = Array.prototype.push;
const objectCreate = Object.create;
const objectFreeze = Object.freeze;
const objectGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const objectGetPrototypeOf = Object.getPrototypeOf;
const mapConstructor = Map;
const mapGet = Map.prototype.get;
const mapHas = Map.prototype.has;
const mapIterator = Map.prototype[Symbol.iterator];
const mapIteratorNext: <Key, Value>(
   this: Iterator<[Key, Value], undefined>,
) => IteratorResult<[Key, Value], undefined> = Object.getPrototypeOf(new Map().entries()).next;
const mapSet = Map.prototype.set;
const setAdd = Set.prototype.add;
const setConstructor = Set;
const setHas = Set.prototype.has;
const setIterator = Set.prototype[Symbol.iterator];
const setIteratorNext: <Value>(this: Iterator<Value, undefined>) => IteratorResult<Value, undefined> =
   Object.getPrototypeOf(new Set().values()).next;
const weakMapGet = WeakMap.prototype.get;
const weakMapSet = WeakMap.prototype.set;
const weakMapConstructor = WeakMap;
const weakSetAdd = WeakSet.prototype.add;
const weakSetHas = WeakSet.prototype.has;

export function createNullPrototypeRecord<Value>(): Record<string, Value> {
   return reflectApply(objectCreate, Object, [null]);
}

/** True if the value is a (sync or async) generator function, via a captured reference. */
export function isGeneratorFunction(value: unknown): boolean {
   return isGeneratorFunctionRef(value);
}

export function isArray(value: unknown): value is unknown[] {
   return reflectApply(arrayIsArray, Array, [value]);
}

export function listOwnKeys(value: object): PropertyKey[] {
   return reflectApply(reflectOwnKeys, Reflect, [value]);
}

export function readOwnPropertyDescriptor(value: object, key: PropertyKey): PropertyDescriptor | undefined {
   return reflectApply(objectGetOwnPropertyDescriptor, Object, [value, key]);
}

export function readPrototype(value: object): object | null {
   return reflectApply(objectGetPrototypeOf, Object, [value]);
}

export function stringifyJson(value: unknown): string | undefined {
   return reflectApply(jsonStringify, JSON, [value]);
}

export function appendArrayValue<Value>(array: Value[], value: Value): void {
   reflectApply(arrayPush, array, [value]);
}

export function forEachArrayValue<Value>(array: readonly Value[], visit: (value: Value) => void): void {
   const iterator: Iterator<Value, undefined> = reflectApply(arrayIterator, array, []);
   while (true) {
      const step = reflectApply(arrayIteratorNext<Value>, iterator, []);
      if (step.done) return;
      visit(step.value);
   }
}

export function freezeRecord<Value>(value: Record<string, Value>): Readonly<Record<string, Value>> {
   return reflectApply(objectFreeze, Object, [value]);
}

export function readMap<K, V>(map: ReadonlyMap<K, V>, key: K): V | undefined {
   return reflectApply(mapGet, map, [key]);
}

export function createMap<K, V>(): Map<K, V> {
   return new mapConstructor<K, V>();
}

export function hasMapKey<K>(map: ReadonlyMap<K, unknown>, key: K): boolean {
   return reflectApply(mapHas, map, [key]);
}

export function writeMap<K, V>(map: Map<K, V>, key: K, value: V): void {
   reflectApply(mapSet, map, [key, value]);
}

export function forEachMapEntry<K, V>(map: ReadonlyMap<K, V>, visit: (key: K, value: V) => void): void {
   const iterator: Iterator<[K, V], undefined> = reflectApply(mapIterator, map, []);
   while (true) {
      const step = reflectApply(mapIteratorNext<K, V>, iterator, []);
      if (step.done) return;
      visit(step.value[0], step.value[1]);
   }
}

export function createSet<Value>(): Set<Value> {
   return new setConstructor<Value>();
}

export function addSetValue<Value>(set: Set<Value>, value: Value): void {
   reflectApply(setAdd, set, [value]);
}

export function hasSetValue<Value>(set: ReadonlySet<Value>, value: Value): boolean {
   return reflectApply(setHas, set, [value]);
}

export function forEachSetValue<Value>(set: ReadonlySet<Value>, visit: (value: Value) => void): void {
   const iterator: Iterator<Value, undefined> = reflectApply(setIterator, set, []);
   while (true) {
      const step = reflectApply(setIteratorNext<Value>, iterator, []);
      if (step.done) return;
      visit(step.value);
   }
}

export function readWeakMap<K extends WeakKey, V>(map: WeakMap<K, V>, key: K): V | undefined {
   return reflectApply(weakMapGet, map, [key]);
}

export function createWeakMap<K extends WeakKey, V>(): WeakMap<K, V> {
   return new weakMapConstructor<K, V>();
}

export function writeWeakMap<K extends WeakKey, V>(map: WeakMap<K, V>, key: K, value: V): void {
   reflectApply(weakMapSet, map, [key, value]);
}

export function addWeakSetValue<Value extends WeakKey>(set: WeakSet<Value>, value: Value): void {
   reflectApply(weakSetAdd, set, [value]);
}

export function hasWeakSetValue<Value extends WeakKey>(set: WeakSet<Value>, value: Value): boolean {
   return reflectApply(weakSetHas, set, [value]);
}
