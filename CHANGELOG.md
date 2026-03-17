# Changelog

## Week ending 2026-03-13

### Highlights

- Hardened plan parsing and persistence by fixing DoS paths in unsanitized local storage handling and `decodePlanString`, then adding missing `Cache-Control` headers on 405 error responses.
- Reduced calendar hot-path work by inlining candidate deduplication, optimizing `selectTopCandidates` sorting allocations, and simplifying the "Today" date check in the render loop.
- Polished calendar interactions on touch devices with tap feedback, sticky-hover fixes, grid micro-interactions, and clearer hover and focus states for custom holiday controls.

### Key PRs

- [#121](https://github.com/mccann-stuart/AntiLearn/pull/121) `⚡ Bolt: Inline Candidate Deduplication`
- [#122](https://github.com/mccann-stuart/AntiLearn/pull/122) `🛡️ Sentinel: [MEDIUM] Fix DoS vulnerability in decodePlanString`
- [#125](https://github.com/mccann-stuart/AntiLearn/pull/125) `🛡️ Sentinel: [HIGH] Fix Persistent DoS via Unsanitized Local Storage`
- [#126](https://github.com/mccann-stuart/AntiLearn/pull/126) `🎨 Palette: Mobile touch interaction polish (sticky hover fix + tap feedback)`
- [#127](https://github.com/mccann-stuart/AntiLearn/pull/127) `perf: optimize \`selectTopCandidates\` sorting allocations`
- [#128](https://github.com/mccann-stuart/AntiLearn/pull/128) `🛡️ Sentinel: [MEDIUM] Fix missing Cache-Control on 405 error responses`
