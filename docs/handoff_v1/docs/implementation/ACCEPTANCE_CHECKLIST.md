# Acceptance / Release Gate Checklist

## Android
- [ ] APK can request and retain required SMS reception permission on supported devices without being the default SMS app where intended.
- [ ] A real test SMS is captured on target phone while app UI closed, screen locked, and after reboot when OS permits.
- [ ] Actual event path does not log/transmit OTP/PIN or unknown messages; dynamic audit of final merged Manifest and network egress passes.
- [ ] Correct multi-part SMS handling; Arabic Unicode, Arabic-Indic digits, dual-SIM when supported.
- [ ] Offline encrypted queue survives loss of Wi-Fi and reboot; test queue health alerts.
- [ ] Rejected unknown message has no text stored by our app; sender spoofing scenarios handled as unverified.

## Windows + transport
- [ ] API uses HTTPS and certificate validation without bypass; QR pairing token is single-use, short-lived and revocable.
- [ ] Each device has its own protected secret; nonce/replay window tested.
- [ ] Windows Service captures while WPF window closed; resumes appropriately after reboot.
- [ ] Event ACK occurs only after durable commit; duplicate POST produces no duplicate transaction.
- [ ] Reconciliation of sequence gaps does not silently drop undelivered events.
- [ ] Database corruption/backup restoration tested; sensitive text access audited.

## Finance
- [ ] 1000 EGP -> fee 50, cost 10, estimated net 40.
- [ ] 1500 EGP -> fee 75, cost 15, estimated net 60.
- [ ] 5000 EGP -> fee 250, cost 50, estimated net 200.
- [ ] Partial-thousand rounding and invalid values tested; store integer piasters.
- [ ] Existing transactions retain fee-rule snapshot after settings are changed.
- [ ] Incoming SMS transfer alone generates zero automatic service fee; eligibility explicit.
- [ ] No SMS alone results in `verified`; evidence/matching record required.
- [ ] Dashboard distinguishes observed amount, estimated income, actual settled costs and verified profit.
- [ ] Reports apply start/end date consistently including time zone.

## UX
- [ ] All Windows screens Arabic RTL, WPF tested on 125% and 150% Windows scaling.
- [ ] All Android screens show pairing state, SMS permission status, queue and last ACK.
- [ ] Disconnected phone visible on Windows; service degraded but historical reporting available.
- [ ] Transactions filter, search, date range, export work with realistic synthetic volume.

## Release
- [ ] Upstream notices, modified file inventory and third-party licenses included in distributable.
- [ ] Release APK / installer correctly signed; sensitive secrets absent from repository.
- [ ] Incident guide and data recovery manual written.
- [ ] Approved real-finance UAT, backup restore, audit log integrity checks.
