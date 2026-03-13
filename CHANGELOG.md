# Changelog

## Week ending 2026-03-13

### Highlights

- Hardened worker error handling to avoid leaking API keys and stack traces in logs.
- Reduced calendar render overhead by moving shared day event handlers out of `renderCalendar`.
- Added danger styling to the Reset Plan button so the destructive action is easier to distinguish.

### Key PRs

- [#111](https://github.com/mccann-stuart/AntiLearn/pull/111) `🛡️ Sentinel: [CRITICAL] Prevent API key and stack trace leakage in worker logs`
- [#112](https://github.com/mccann-stuart/AntiLearn/pull/112) `⚡ Bolt: Extract calendar event handlers to reduce memory overhead`
- [#113](https://github.com/mccann-stuart/AntiLearn/pull/113) `🎨 Palette: Add danger styling to Reset Plan button`
