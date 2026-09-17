export function directSecretRead(environment: NodeJS.ProcessEnv): string | undefined {
   return environment.DATABASE_URL;
}

function nestedRead(environment: NodeJS.ProcessEnv, remaining: number): string | undefined {
   return remaining === 0 ? directSecretRead(environment) : nestedRead(environment, remaining - 1);
}

export function outermostCaller(environment: NodeJS.ProcessEnv): string | undefined {
   return nestedRead(environment, 20);
}
