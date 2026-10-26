# Implementation Roadmap — Deliverable Gates

| Stage | Scope | Concrete exit evidence |
|---|---|---|
| EPIC 0 | Pin SMSGate source; audit permissions, dependency inventory, license; build upstream APK; **device receives test SMS** | `UPSTREAM_AUDIT.md`, exact Git SHA, successful builds, real phone screenshot/log redacted, blockers |
| EPIC 1 | Event schema, QR pairing contract, TLS/HMAC test vectors, financial domain, synthetic parser samples | validated OpenAPI/JSON Schema, shared Kotlin/.NET golden vectors, fee tests |
| EPIC 2 | Remove send/MMS/cloud extras, create allow-list+OTP deny-list, Android encrypted outbox, secure sync, QR, health UI | Debug APK with physical phone permission/restart/offline tests |
| EPIC 3 | Windows Service HTTPS listener, pairing, authorized devices, SQLite atomic inbox, idempotency, secure IPC | Windows Service installed and receiving events while WPF is closed |
| EPIC 4 | SMS parser with versioning, needs-review queue, fees/cost rule snapshots, audit trail, period aggregation | finance integration tests incl partial-thousand, duplicates, negative cases |
| EPIC 5 | WPF RTL screens, UX fidelity, filtered tables, export CSV/Excel, backup/restore, installer | installable Windows app, reviewed screenshots and keyboard navigation |
| EPIC 6 | Real-device UAT, 48h disconnection, test rollback/migrations, key rotation, failure alerts, security review | test report, signed Android APK, installer, operator runbook, go/no-go decision |

## Hard blockers before production
1. Prove SMS receive permission works on target Android ROM/APK install source.
2. Confirm actual SMS templates with redacted consented samples; do not invent provider messages and label them actual.
3. Validate definition of a chargeable cash-out service vs plain incoming or outgoing transfer; current fee policy is *illustrative user default*.
4. Test secure recovery from Android offline/outbox, Windows shutdown, duplicate events, dropped ACK, clock skew and TLS rotation.
5. Create reconciliation controls from an independent provider or authorized ledger source. SMS alone never verifies money.

## PR sequence
- PR-000: repository structure, licensed upstream audit and CI skeleton.
- PR-001: contracts + golden vectors + reference fee tests.
- PR-002: Android capture/filters/outbox; mock server tested.
- PR-003: Windows service, SQLite, ACK and replay tests.
- PR-004: pairing / secure mutual trust / device revocation.
- PR-005: parser, reconciliation, finance engine.
- PR-006: WPF dashboard and detail screens.
- PR-007: reports/backup/audit, restore test, UAT.

**Do not start building the full UI before EPIC 0 feasibility proof.** Use existing UI prototype only as visual UX reference.
