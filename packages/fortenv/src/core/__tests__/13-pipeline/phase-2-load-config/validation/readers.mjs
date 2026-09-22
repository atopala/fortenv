import { fortenv } from "fortenv";

export function raw() {
   return process.env.DATABASE_URL;
}

export function original() {
   return process.env.DATABASE_URL;
}

export const wrapped = fortenv.string(original);
export const bound = wrapped.bind(undefined);

export function forged() {
   return process.env.DATABASE_URL;
}

// Forgeable metadata must not make a plain function an actual Fortenv wrapper.
forged.__fortenv = true;
Object.defineProperty(forged, "name", { value: wrapped.name });

export const objectTarget = { read: wrapped };
