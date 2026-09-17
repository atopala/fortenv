# 15.01 — Secret delivery

These fixtures replace one shared JavaScript operation after Fortenv has loaded, either while the real config dependency graph evaluates or after bootstrap. An authorized wrapper must still receive only `DATABASE_URL`; `PRIVATE_KEY` is protected with no grants. Replacement hooks must not observe either value or receive Fortenv's private backing store.

The secure assertion remains constant across the TDD cycle. The vulnerable implementation is expected to produce `intercepted: true` for the confirmed SEC-01, SEC-02, and SEC-03 cases.
