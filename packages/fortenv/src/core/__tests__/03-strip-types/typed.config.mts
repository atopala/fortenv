interface Config { secrets: Record<string, readonly Function[]> }
export default { secrets: { DATABASE_URL: [] } } as const satisfies Config;
