# Agent Instructions — Wallet Manager + Receiver

You are implementing a **financial SMS observation and bookkeeping assistant**, **not** a payment settlement authority or an SMS interception tool. Build only for the user's own authorized Vodafone Cash device and Windows machine.

## Read first
- `00_READ_ME_FIRST_AR.md`
- `docs/architecture/technical_blueprint.md`
- `docs/uiux/UI_UX_Specification.md`
- `docs/implementation/ROADMAP.md`
- `docs/implementation/ACCEPTANCE_CHECKLIST.md`

## Non-negotiable rules
1. **First task is upstream audit, never blindly copy or invent files from SMSGate.** Fetch the pinned audited release, record exact commit SHA, verify license and build, inspect module graph, Manifest, Receivers, jobs, hooks, analytics/telemetry, and inbound data paths. Version numbers in source blueprint are a historical reference and must be verified upstream before pinning.
2. Keep Apache-2.0 notices, notices for dependencies, and a `CHANGES_FROM_UPSTREAM.md`; do not mistake the *handoff docs* for source code or a license grant for third-party logos.
3. SMS allowed-list filtering must occur **on Android before transmission or permanent application storage**. Reject OTP/PIN/verification/password-like data first. Unknown messages are ignored or safely represented by anonymous counters, not uploaded verbatim.
4. Never send any real SMS, SIM, PIN, OTP, credentials, personal phone numbers, or transaction secrets to logs, unit fixtures, source control, screenshots, analytics, or AI services.
5. SMS means **observed**. Never auto-confirm payment, credit customer balance, or mark a financial settlement verified from SMS alone. Use independent reconciliation or audited human review.
6. No cloud dependency is required. On LAN use authenticated **TLS**, device identity and replay protection; don't bypass certificate validation; prefer VPN for remote setups.
7. Do not drop events on connection loss. Use local durable encrypted outbox, at-least-once retry, ACK only after Windows DB commit, and unique `(device_id,event_id)`.
8. Keep financial amounts in integer piasters, use deterministic rounding, freeze `fee_rule_version` per service transaction. Default: EGP 50/1k service fee, EGP 10/1k estimated cost, EGP 40/1k estimated profit, **pro rata**; don't bill every incoming SMS.
9. Windows Service receives when WPF window is closed; when machine sleeps, Android queue must preserve events.
10. All important features ship with unit/integration tests, structured privacy-safe logs, and fail-safe UI states.
11. No claim of production readiness until Android SMS permission proof, offline/recovery UAT, security review, reconciliation review, backup restore, and operating runbook have passed.
12. UI must be Arabic RTL-first, readable large controls, professional brand-neutral red scheme. Do not use Vodafone logos/trademarks in release assets without permission.

## Execution order
- EPIC 0 — Upstream source audit/build and device SMS proof. Output a summary, blockers, source SHAs.
- EPIC 1 — Protocol and fee domain tests. Resolve API contract ambiguities; create golden cross-platform test vectors for HMAC and event JSON.
- EPIC 2 — Android collector, filter, durable outbox, pairing and permission state UI.
- EPIC 3 — Windows Receiver Service and local database migrations; prove ACK and dedup.
- EPIC 4 — Parsing, human review, fee engine, reporting, reconciliation.
- EPIC 5 — WPF RTL UI, installer, backup/restore.
- EPIC 6 — Real device UAT, resilience/security, production gates, signed releases.

## Deliverables per stage
- Source + tests + passing build command + build artifacts (when environment permits) + release notes + known limitations.
- Never silently substitute mocked screens or synthetic tests for real Android/Windows build validation.
- If work environment is not Windows/Android SDK capable, implement/test available modules and report blocked platform checks without pretending artifacts compiled.

## UI and product constraints
- V1 is **one Vodafone Cash SIM/phone/wallet and one Windows machine**, architecture extensible to multiple devices.
- Phone is receiver/sync app, not another financial dashboard.
- Large desktop cards: observed incoming/outgoing, service fees, *estimated* net profit; timestamped reporting.
- Source-of-truth for fee settings on Windows. Historical transaction fee snapshots immutable without explicit audited correction.
- Support daylight-saving-safe, timezone-aware event times with Africa/Cairo presentation, UTC storage preferred.

## Definition of Done
See `docs/implementation/ACCEPTANCE_CHECKLIST.md`. Stop at each gate and report verified evidence.
