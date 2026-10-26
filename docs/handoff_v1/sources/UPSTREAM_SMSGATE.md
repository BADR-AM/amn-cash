# Upstream project — compliance and audit

Repository: https://github.com/capcom6/android-sms-gateway
Releases: https://github.com/capcom6/android-sms-gateway/releases
Docs: https://docs.sms-gate.app/
Reported base candidate as of original blueprint (2026-10-27): `v1.77.4`; later prerelease `v1.77.5` may contain SMS receiver changes — **re-check actual release tags, changelog and source commit before selecting**.

The upstream code is not bundled in this handoff ZIP. Codex must fork/clone it, check its actual license at pinned SHA (reported Apache-2.0), inspect all third-party licenses, and keep the required LICENSE/NOTICE/copyright attributions after reuse. Generate `LICENSES/UPSTREAM_LICENSE.txt`, `THIRD_PARTY_NOTICES.md`, `CHANGES_FROM_UPSTREAM.md` from actual verified source. Do not invent their contents.

Audit checklist: source tree module map; SMS receive intent handling; multipart and unicode; retry/outbox semantics and retention; cloud mode; telemetry; network egress; app restart handling; package/app signing; SDK and Gradle; merged AndroidManifest permissions; API stability; API callback concurrency; dependency security and license inventory; install-time SMS permission grant restrictions on target device.

Make a pinned source copy or Git branch separately and record `upstream_commit`, `upstream_tag`, `fork_commit`, `date`, `build_command`, `dependencies`, `reused_files` with origin mapping and changes.
