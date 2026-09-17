// Enums require transformation, which native strip-only mode does not provide.
enum Secret { Database = 'DATABASE_URL' }
export default { secrets: { [Secret.Database]: [] } };
