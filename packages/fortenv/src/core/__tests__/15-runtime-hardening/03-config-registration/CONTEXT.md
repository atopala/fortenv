# 15.03 — Config registration

These fixtures attack the real configuration validation and registration pass at T1, after discovery has protected the configured names and before grants are installed. Replacements must not change the validated names or target identities that Fortenv copies from `defineConfig()`.

Each scenario executes the built public package in a fresh subprocess, uses fake values, proves its replacement is active, and asserts that an unconfigured wrapper receives no secret.

The Map-iterator fixture replaces iteration at T1 and attempts to rewrite the otherwise empty `PRIVATE_KEY` target array while the real config is copied. Before the fix, the unconfigured wrapper received that secret. Configuration copying and grant construction now traverse Maps through iterator creation and advancement captured before real config dependencies load, so the replacement remains active only for its harmless positive control.

The array-operation fixture covers `Array.prototype.push` while validated targets are copied and array iteration while grants are installed. Before the fixes, either replacement appended an attacker wrapper to `DATABASE_URL`. Target copying and grant installation now use captured append, iterator creation and iterator advancement operations.

The descriptor fixture replaces `Object.getOwnPropertyDescriptor` and returns `[attackerWrapper]` for the otherwise empty `PRIVATE_KEY` target list. Before the fix, the real config copy accepted that forged value and delivered the secret. Config validation now uses captured array detection, own-key listing, descriptor lookup and prototype lookup; the replacement remains active only for its harmless positive control.
