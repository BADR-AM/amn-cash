# Security / Threat Model / Operations Notes (Implementation Guide)

Assets: SMS financial message text, transaction metadata, partial counterpart identifier, local queue, Windows database, fee rules, authorization secrets, backup files.

Attack surfaces: malicious sender spoofing SMS, compromised Android or PC, unauthorized webhook, replay, phone theft, malware/backup leakage, man-in-the-middle, event injection, denied SMS permission, app killed by OS, Windows sleep, database duplicate, human misclassification.

Controls:
- Screen message **deny-list for OTP/PIN before allow-list**, and only store **confirmed-format financial messages** (meaning format selection, not settlement confirmation). Empty/unknown messages ignored safely.
- Minimal APK privileges and remove source project's SMS-sending, telemetry, cloud and unrelated providers if not needed; inspect the whole merged Manifest and transitive dependencies.
- Authenticate each phone; QR bootstrap token never becomes permanent credential; TLS pin must be verified correctly with allowed rollover procedure.
- Use Android Keystore for key wrapping and Windows DPAPI for local secrets; encrypt queue and sensitive message text at rest. Define recovery for lost keys and keep backups distinct.
- Protect local listener by LAN firewall rules. No public open port. For remote use private VPN plus authenticated TLS.
- Verify message event header, signature, timestamps and nonce replay cache. ACK only after commit; `UNIQUE(device_id,event_id)`.
- Use RBAC in Windows: Admin, Operator, Auditor. Transactions should support immutable event/audit append plus corrections, not silent edits or destructive delete.
- Protect scheduled encrypted backup, retention and restore test; masked data in UI and no raw SMS/phone in crash reports.
- Watchdog monitor for last heartbeat, last ACK, pending queue size, SMS permission/battery optimizations. Alert staff on prolonged disconnect; keep system in degraded state rather than asserting all transactions are captured.
- SMS financial message content must not itself cause verified payment. Independent reconciliation is required before ledger settlement.

Operational runbook requirements:
1. Setup: install signed APK, enable SMS receiver permission, disable aggressive battery restrictions with informed user action, pair via QR, record certificate identity.
2. Test: send **synthetic benign** SMS, verify filter and Windows ACK. Then use agreed controlled real-SIM test if authorized.
3. Network failure: events accumulate in encrypted outbox; if backlog exceeds limit alert, preserve storage, avoid dropping un-ACKed data.
4. Device replacement: revoke old phone, re-pair new phone, reconcile historical gaps against authoritative wallet history.
5. Disaster recovery: restore encrypted backup to isolated instance, validate checksum and access authorization; do not double-post ledger settlements.
