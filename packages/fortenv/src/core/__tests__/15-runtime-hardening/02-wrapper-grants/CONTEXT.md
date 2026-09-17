# 15.02 — Wrapper grants

These fixtures attack the exact-identity authorization registry after bootstrap. An unregistered `fortenv()` wrapper is accessible to the fixture but receives no configured grant. Replacing collection lookups must not create permission for it.

SEC-04 is initially tested at runtime because that is the timing previously reproduced. Config-loading tampering is investigated separately under the broader identity and registration batch.
