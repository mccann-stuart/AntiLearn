# Changelog

## Unreleased

### Highlights

- Hardened shared plan and localStorage ingestion by requiring real `YYYY-MM-DD` calendar dates plus integer allowance/year values before state is applied.
- Preserved accessible share-button icon markup when the button temporarily changes to the copied state.
- Tightened UI layout by constraining the custom holiday panel to the main content width and preventing compact allowance clipping.
- Aligned package metadata with the MIT license declared in `LICENSE.md`.

### Key PRs

- Pending.

## Week ending 2026-04-19

### Highlights

- No new commits or pull request merges landed this week.

### Key PRs

- None.

## Week ending 2026-04-12

### Highlights

- No new commits or pull request merges landed this week.

### Key PRs

- None.

## Week ending 2026-04-05

### Highlights

- No new commits or pull request merges landed this week.

### Key PRs

- None.

## Week ending 2026-03-29

### Highlights

- Hardened the app by fixing a DOM-based XSS path tied to `innerHTML` usage and stopping API keys from leaking into error logs.
- Reduced calendar computation overhead by optimizing date parsing, dynamic-programming allocation and loop structure, and top-candidate selection.
- Improved accessibility and UI clarity with better feedback for dynamic interactions and loading states, clearer disabled-export guidance, and hiding decorative button emojis from screen readers.

### Key PRs

- [#153](https://github.com/mccann-stuart/AntiLearn/pull/153) `🔒 Sentinel: Fix DOM-based XSS via innerHTML`
- [#159](https://github.com/mccann-stuart/AntiLearn/pull/159) `🎨 Palette: Add accessible feedback for dynamic interactions`
- [#160](https://github.com/mccann-stuart/AntiLearn/pull/160) `⚡ Bolt: Optimize date string parsing`
- [#161](https://github.com/mccann-stuart/AntiLearn/pull/161) `🛡️ Sentinel: [CRITICAL] Fix API Key Leakage in Error Logs`
- [#162](https://github.com/mccann-stuart/AntiLearn/pull/162) `🎨 Palette: Add accessible loading states to spinner`
- [#164](https://github.com/mccann-stuart/AntiLearn/pull/164) `🎨 Palette: Add tooltip explaining disabled export button`
- [#165](https://github.com/mccann-stuart/AntiLearn/pull/165) `⚡ Bolt: Optimize DP array allocation and loop hoisting in findBestCombination`
- [#169](https://github.com/mccann-stuart/AntiLearn/pull/169) `🎨 Palette: [Accessibility] Hide button emojis from screen readers`
- [#170](https://github.com/mccann-stuart/AntiLearn/pull/170) `⚡ Bolt: [Optimize selectTopCandidates performance via pre-allocated arrays and manual shifts]`

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
