# 15.04 — Environment guard

These fixtures replace operations used by the permanent `process.env` proxy at T2, after bootstrap. Protected reads must still throw `FortenvAccessError`, protected mutations must still fail, and enumeration must still omit configured names.

Every scenario runs in a fresh subprocess because the guard cannot be uninstalled. Fixtures use only fake values and restore attacker-controlled built-ins before reporting boolean observations.

The Set-membership fixture replaces `Set.prototype.has` at T2 and attempts to make the protected-name lookup return false. Before the fix, a direct read returned instead of throwing, a protected write succeeded, and enumeration exposed the inserted protected name. The replacement did not recover the scrubbed startup value. The guard now uses membership captured before real config dependencies load, preserving denial and filtering while the replacement remains active for a harmless control.

## trap-operations (SEC-10 completion)

Completes the SEC-10 guard probe by replacing the global operations the guard's Proxy traps use internally after bootstrap — `Reflect.get`, `Reflect.ownKeys`, and `Array.prototype.filter` — and attempting a protected read and enumeration.

Disposition: held (not reproduced). With all three replacements provably active, the protected read still throws `FortenvAccessError`, never returns the attacker's substitute value, and enumeration still hides the protected name; the authorized path still works. The guard decides `protectedKey(key)` through the eagerly captured `Set.prototype.has` and `normalizeName` before any `Reflect.get` is consulted, so the protected-key decision does not depend on the replaceable global `Reflect.*`; those are reached only for non-secret keys, where substitution is harmless. This closes the SEC-10 operations left open after the `Set.has` slice.
