import assert from 'node:assert/strict';

// Generated snapshots are executed by Node, outside the test TypeScript project.
const { default: config } = await import(new URL('./__snapshots__/escaped-bindings.config.mjs', import.meta.url).href);

const targets = config.secrets.DATABASE_URL;
assert.equal(targets.length, 9);
for (const target of targets) assert.equal(typeof target, 'function');
for (const target of targets.slice(0, 3)) assert.equal(target, targets[0]);
for (const target of targets.slice(3)) assert.equal(target, targets[3]);
assert.notEqual(targets[0], targets[3]);
