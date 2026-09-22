import { fortenv } from "fortenv";

// Choose a fixture operation, not a policy: the policy comes only from defineConfig.
export function scanEnvironment() {
   switch (process.argv[2]) {
      case "keys":
         return Object.keys(process.env);
      case "values":
         return Object.values(process.env);
      case "entries":
         return Object.entries(process.env);
      case "reflect":
         return Reflect.ownKeys(process.env);
      case "spread":
         return { ...process.env };
      case "json":
         return JSON.stringify(process.env);
      case "for-in": {
         const keys = [];
         for (const key in process.env) keys.push(key);
         return keys;
      }
      default:
         throw new Error("Unknown enumeration fixture operation");
   }
}

console.log("scan:import:before");
export const importTimeScan = scanEnvironment();
console.log("scan:import:after");
export const authorizedScan = fortenv.string(scanEnvironment);
export const read = fortenv.string(({ DATABASE_URL }) => DATABASE_URL);
