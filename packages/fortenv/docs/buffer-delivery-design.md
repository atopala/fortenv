# Fortenv buffer delivery — design proposal

Status: **proposal for review.** This document proposes a public-API and design-contract change (extending `fortenv` with a `fortenv.buffer` variant that delivers secrets as zeroable `Buffer`s, and holding captured secrets as zeroable buffers internally). It does not change the shipped contract until approved. It also records the memory-hardening options considered in discussion, each with an honest assessment of what it does and does not protect against, so the reasoning is not revisited as if untried.

## 1. Motivation and honest scope

Injected secrets are today delivered as JavaScript **strings**. Strings in V8 are immutable and garbage-collected: their bytes cannot be overwritten and their lifetime cannot be controlled. This is the root of the shared-heap limitation — a heap snapshot (`v8.getHeapSnapshot()`), the inspector (`--inspect`), a native addon, or `/proc/<pid>/mem` can read a live secret string, and nothing at the JavaScript layer can prevent or erase it.

A `Buffer` (or `Uint8Array`) is backed by memory the holder **can** overwrite with `buf.fill(0)`. Delivering secrets as buffers lets security-conscious callers work in memory they can deterministically wipe after use, shrinking the window during which a plaintext secret is resident.

**What this proposal does:** offer an opt-in `fortenv.buffer(fn)` that delivers each configured secret as a `Buffer`, and hold the captured master value internally as a zeroable buffer rather than a retained string.

**What this proposal does NOT do — stated plainly so we never overclaim:**

- It does **not** make the secret "never a string in memory." The value arrives in `process.env` as a string built by Node's bootstrap **before any Fortenv code runs** (T0); that startup string already exists in the heap and cannot be erased from inside the process (see §6). Buffer delivery only governs the value **from injection onward**.
- It **shrinks the exposure window; it does not eliminate it.** A heap snapshot or memory read taken while the buffer is live still captures the bytes. A buffer is still in-process memory: a native addon, `--inspect`, or `/proc/<pid>/mem` reads it as easily as a string.
- It provides **little benefit once the value is converted to a string** — `buf.toString()`, or handing the buffer to a dependency that stringifies it (e.g. a Postgres client that parses a connection string), re-materializes an immutable heap string outside Fortenv's control.
- It is **most useful for secrets your own code uses in buffer-native operations and then wipes** (HMAC signing, encryption keys, token derivation), and of **limited value for long-lived config consumed as strings by third-party clients**.

The one architecture that genuinely avoids the startup string is the launcher model (§6), which is separate future work.

## 2. Proposed public API

`fortenv` becomes callable **and** an object:

- `fortenv(fn)` — unchanged; delivers secrets as strings. Preserved exactly for backward compatibility.
- `fortenv.string(fn)` — explicit alias of `fortenv(fn)` (`fortenv.string === fortenv` in behavior).
- `fortenv.buffer(fn)` — delivers each configured secret as a `Buffer` (UTF-8 encoding of the value), or a granted-missing value as `undefined`.

The delivery mode is a property of the **wrapper**, not the secret: `fortenv.buffer(fn)` means "this callback receives all of its granted secrets as buffers." A single secret may be granted to a `.string` wrapper and a `.buffer` wrapper simultaneously; each wrapper receives the value in its own form, derived per call.

Types:

- `SecretValues` (existing) — `Readonly<Record<string, string | undefined>>`.
- `SecretBuffers` (new) — `Readonly<Record<string, Buffer | undefined>>`.

All existing injection invariants hold identically for the buffer variant: a fresh, frozen, null-prototype object per call; own enumerable properties for exactly the granted keys; granted-missing values present as own properties with value `undefined`; unusual valid names (`__proto__`, `constructor`, `toString`) handled as ordinary own properties.

## 3. Internal model (buffer-backed private store)

- **Capture:** at phase-1 capture, store each secret's value in the private map as a zeroable `Buffer` (`Buffer.from(value, "utf8")`) rather than retaining the original string. Fortenv drops its reference to the source string. (This does not erase the startup string — see §6 — but ensures Fortenv itself retains only wipeable memory.)
- **Per-call derivation:** each injection copies from the master buffer into a **fresh** per-call buffer (for `.buffer`) or decodes to a fresh string (for `.string`). Callers never receive the master buffer, and mutating a delivered value never affects the master or another call.
- **String variant unchanged in observable behavior:** `.string` decodes the master buffer to a UTF-8 string per call, preserving today's exact contract.

## 4. Buffer lifetime and wiping ownership (the central question)

Fortenv cannot know when a callback has finished using a delivered buffer (it may be retained across awaits, stored, passed on). Therefore:

- **The caller owns wiping.** A delivered per-call buffer is the caller's to `fill(0)` when done. The docs state this plainly; Fortenv does not auto-wipe a value the caller may still hold.
- **Fortenv owns the master.** The internal master buffer is wiped on `failBootstrap()` and is never handed out.
- **No auto-wipe-on-return.** Auto-wiping after a synchronous return would corrupt async callbacks that use the value across awaits, and would violate the "delivered values obey normal lifetimes" contract. Rejected.
- **Optional helper (open question, §7):** whether to expose a `wipe(secrets)` convenience that zeroes all buffers in a delivered object. Deferred pending review.

## 5. Options considered and rejected (recorded so they are not retried as untested)

- **In-process encryption (encrypt at rest, decrypt on demand).** Rejected: the decryption key must live in the same heap, so a heap reader takes the key instead; and the decrypted value must materialize in the heap to be used. No net gain against the stated threat; adds complexity to the most sensitive path. Security theater.
- **`global.gc()` to erase the startup string.** Rejected as a _guarantee_: GC frees but does not zero memory (bytes linger in reclaimed regions), V8 may intern the string (immortal, uncollectable), copies made by code running before/around Fortenv cannot be dropped, and it requires forcing `--expose-gc` on consumers. The honest subset of this idea — hold secrets as zeroable buffers and retain no string — is adopted in §3 instead.
- **Buffer delivery presented as memory protection.** Rejected framing: buffers shrink the window and enable wiping; they are not isolation. The disclaimer in §1 is mandatory wherever the feature is described.

## 6. Why "never a string in this process" is unachievable in-process

Node's C++ bootstrap reads the OS environment block and has V8 build `process.env` **string** values before any user code — including `@fortenv/secrets/register` — executes. Fortenv reads an already-materialized string; there is no JavaScript hook before that materialization. Deleting the key and GC'ing cannot guarantee erasure (§5). Therefore the startup string is an unavoidable T0 artifact in-process, the same root as the `/proc/self/environ` limitation.

The only design that removes it: a **launcher** starts the app with the secret **absent from the child's environment** and delivers it after startup over a pipe/fd as **bytes into a buffer** — so Node never builds a startup string for it, and (composed with §2) it can stay a buffer until a consumer stringifies it. Even then, same-process native/OS memory reads still apply, and "restrict the secret to only the Fortenv module within the process" is impossible (one address space = one trust domain). The launcher is separate future work (design §90); this proposal composes with it but does not require it.

## 7. Open questions for review

- Expose a `wipe(secrets)` helper, or leave wiping entirely to the caller?
- `SecretBuffers` element type: `Buffer` (Node-specific, ergonomic) vs `Uint8Array` (platform-neutral)? Proposal: `Buffer`, since Fortenv is Node-only.
- Should `fortenv.buffer` be a distinct wrapper factory (proposed) or a per-secret config flag? Proposal: wrapper factory — keeps config declarative and delivery a property of the consumer.
- Does buffer delivery warrant its own numbered test group and a `SEC-25` "buffer-path built-in tampering" investigation (e.g. replacing `Buffer.from`/`Buffer.prototype.fill`)? Proposal: yes, once implemented, red-first like the other SEC items.

## 8. New attack surface introduced (must be tested if built)

The buffer path adds `Buffer.from`, `Buffer.prototype` operations, and buffer copying to the sensitive path. These become new tamper targets (a dependency replacing `Buffer.from` or `Buffer.prototype.fill` after Fortenv loads). Following the group-15 methodology, these would be captured as intrinsics and probed with fully-functional-but-malicious reimplementations asserting no secret value is captured — the same discipline applied to `Map`/`Set`/`WeakMap`/`Reflect`.

## 9. Test plan (TDD, after contract approval)

Red-first, in a new numbered group (proposed `17-buffer-delivery`) plus unit coverage:

1. `fortenv.buffer(fn)` delivers a `Buffer` whose bytes UTF-8-decode to the configured value; `fortenv(fn)` and `fortenv.string(fn)` unchanged (string identity/shape).
2. Delivered buffer is fresh per call; mutating or wiping it does not affect the master, another call, or another wrapper.
3. Granted-missing value is an own `undefined` property; ungranted keys absent; frozen null-prototype object; unusual valid names correct.
4. A secret granted to both a `.string` and a `.buffer` wrapper delivers each form correctly.
5. Protected `process.env` reads still throw for buffer-mode secrets; enumeration still hides them; fail-closed unchanged.
6. No diagnostic path emits buffer _contents_ (extends SEC-22 to the buffer path).
7. `SEC-25` (once built): replacing `Buffer.from`/`Buffer.prototype.fill` after load cannot capture the secret (aggressive-siphon style).
8. Master buffer wiped on failed bootstrap; environment protection intact after failure.
