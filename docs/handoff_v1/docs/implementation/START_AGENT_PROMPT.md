# Ready-to-paste prompt for Codex / Coding Agent

You have been given the `Wallet_Manager_Coding_Handoff_v1` folder. Treat the supplied specification as the source of truth for product requirements, not as proof that functionality is implemented.

Please:
1. Read `AGENTS.md`, `00_READ_ME_FIRST_AR.md`, the architecture blueprint, UI/UX specification, and the acceptance checklist.
2. Summarize confirmed requirements and list **only genuine blockers** that require external hardware or real credentials.
3. Start **EPIC 0**: retrieve and audit SMSGate from its official repository, pin and record exact source tag + commit, verify Apache 2.0 and dependency notices, inspect `AndroidManifest.xml` and SMS flow, build upstream from source. If Android SDK or physical handset unavailable, report the limitation explicitly.
4. In parallel establish monorepo skeleton and implement deterministic fee domain tests and JSON schema validations; do not build financial confirmation from SMS alone.
5. Next implement an encrypted Android outbox, secure phone-to-Windows pairing and ACK-after-commit, then WPF RTL UI in the order of roadmap.
6. Produce tested source, build scripts, reproducibility notes, signed release steps, and a status report on acceptance criteria after each EPIC.

V1: own authorized single Vodafone Cash SIM, one Android device, one Windows PC, Windows Native WPF, Android Native APK, local-first, no mandatory cloud, RTL Arabic, default user fee 50 EGP/1000, estimated cost 10 EGP/1000, net estimated profit 40 EGP/1000, pro-rata; configurable versioned rules; date-range reports; no OTP collection or storage; no automated settlement from SMS.

The HTML and images in `design/` are visual references only; do not embed actual Vodafone brand marks in distributable production UI without permission.
