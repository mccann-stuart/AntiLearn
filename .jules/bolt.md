## 2025-02-18 - [Optimizing Date Formatting]
**Learning:** `Date.prototype.toLocaleDateString` with an options object is significantly slower (~50x) than `Intl.DateTimeFormat.prototype.format` when called repeatedly, because it instantiates a new formatter on every call.
**Action:** For date formatting in loops or high-frequency render functions (like recommendation lists), always create a shared `Intl.DateTimeFormat` instance at the module level and reuse it.

## 2026-02-18 - Overly broad cache invalidation triggering full recalculation
**Learning:** In `public/app.js`, toggling a date on the calendar called `invalidateInsightCaches()`, which cleared ALL caches (including the expensive `yearComparisonCache` and `dayTypeCache`). This caused a full O(N) DP recalculation of optimal plans (~60-150ms per click), despite date selections not changing the static properties that optimal plans depend on (year, region, weekends, custom holidays).
**Action:** Introduced a targeted `invalidateBookedDaysCaches()` function that only clears `dayInsightCache` and resets `bookedDaysIndices`. Use localized cache invalidation for micro-interactions to prevent cascading performance drops.
