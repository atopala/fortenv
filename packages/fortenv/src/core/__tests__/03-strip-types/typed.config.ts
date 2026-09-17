type Config = { secrets: Record<string, readonly Function[]> };
const config: Config = { secrets: { DATABASE_URL: [] } };
export default config satisfies Config;
