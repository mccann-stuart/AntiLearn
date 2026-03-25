# Changelog

## Week ending 2026-03-22

### Highlights

- Hardened client-side rendering and caching by replacing `innerHTML` assignments with native DOM methods and fixing CDN cache poisoning on error responses.
- Reduced calendar generation and rendering overhead by hoisting dynamic-programming loop conditions, minimizing DOM reflows, tightening candidate selection, and using a `Set` for holiday merging.
- Improved mobile and accessibility polish with iOS safe-area and PWA metadata, better calendar alignment, broader ARIA labeling and tooltip coverage, clearer share and copy feedback, and added `showToast` DOM update tests.

### Key PRs

- [#138](https://github.com/mccann-stuart/AntiLearn/pull/138) `🛡️ Sentinel: Refactor innerHTML assignments to native DOM methods`
- [#143](https://github.com/mccann-stuart/AntiLearn/pull/143) `🛡️ Sentinel: [HIGH] Fix CDN Cache Poisoning on Error Responses`
- [#140](https://github.com/mccann-stuart/AntiLearn/pull/140) `feat(ux): add iOS safe area padding and PWA meta tags`
- [#142](https://github.com/mccann-stuart/AntiLearn/pull/142) `perf(ui): minimize DOM reflows in calendar rendering`
- [#146](https://github.com/mccann-stuart/AntiLearn/pull/146) `⚡ Bolt: Optimize selectTopCandidates with bounded binary insertion`
- [#150](https://github.com/mccann-stuart/AntiLearn/pull/150) `⚡ Bolt: optimize holiday merging using Set-based lookup`
- [#152](https://github.com/mccann-stuart/AntiLearn/pull/152) `🎨 Palette: [UX improvement] Add ARIA label to Copied state and tooltips to icon-only buttons`

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
