## 2025-02-18 - [Optimizing Date Formatting]
**Learning:** `Date.prototype.toLocaleDateString` with an options object is significantly slower (~50x) than `Intl.DateTimeFormat.prototype.format` when called repeatedly, because it instantiates a new formatter on every call.
**Action:** For date formatting in loops or high-frequency render functions (like recommendation lists), always create a shared `Intl.DateTimeFormat` instance at the module level and reuse it.

## 2026-02-18 - Overly broad cache invalidation triggering full recalculation
**Learning:** In `public/app.js`, toggling a date on the calendar called `invalidateInsightCaches()`, which cleared ALL caches (including the expensive `yearComparisonCache` and `dayTypeCache`). This caused a full O(N) DP recalculation of optimal plans (~60-150ms per click), despite date selections not changing the static properties that optimal plans depend on (year, region, weekends, custom holidays).
**Action:** Introduced a targeted `invalidateBookedDaysCaches()` function that only clears `dayInsightCache` and resets `bookedDaysIndices`. Use localized cache invalidation for micro-interactions to prevent cascading performance drops.

## 2026-02-18 - High-Frequency Array Methods vs. Native Loops & Key Hashing
**Learning:** In hot loops within optimizer logic (e.g. `generateAllCandidates` and `selectTopCandidates`), using higher-order functions like `.forEach()` and creating string-based keys for `Set` deduplication (e.g., ``${c.startIdx}-${c.endIdx}``) resulted in severe performance bottlenecks due to constant allocation overhead. Replacing these with native `for` loops and computing 32-bit integer keys using bitwise shifting (e.g., `(c.startIdx << 16) | c.endIdx`) drastically sped up the execution (yielding an ~40% overall reduction in `findOptimalPlan` duration). Also, copying arrays with `.slice()` instead of spread syntax (`[...arr]`) provides a non-trivial performance boost when invoked thousands of times. Furthermore, native `TypedArray.prototype.fill()` is considerably faster than manually assigning values in a nested loop.
**Action:** In deeply nested or performance-critical loops such as DP optimization pipelines: favor native `for` loops over `.forEach()`; prefer integer combinations (via bitwise operators if within limits) over string interpolation for `Set` and `Map` lookup keys; use `.slice()` instead of the spread operator for array copies; and leverage native functions like `.fill()` when initializing structures.
## 2026-03-06 - Avoid Inline Closures in Render Loops
**Learning:** Instantiating anonymous functions/closures inside high-frequency render loops (such as rendering ~365 calendar days via `renderCalendar`) creates significant memory footprint and increases garbage collection overhead.
**Action:** Extract inline event listeners to shared, module-level functions. Use element `dataset` attributes (e.g., `e.currentTarget.dataset.date`) to pass context to the shared handlers instead of relying on closure variables.

## 2026-02-18 - String Concatenation vs Template Literals
**Learning:** In highly repetitive, performance-critical loops like `toLocalISOString` in `public/app.js` which format dates, standard string concatenation (`+`) is ~4x faster than template literals (`${var}`).
**Action:** Use standard string concatenation (`+`) instead of template literals for simple string construction in high-frequency rendering functions.

## 2026-04-18 - Inline Array Deduplication
**Learning:** In candidate generation loops (`generateAllCandidates`), pushing all possible items to an intermediate array and deduplicating it afterwards is ~17% slower than performing deduplication inline before pushing to the array. This is due to the large number of intermediate objects created that must then be garbage collected.
**Action:** When generating large sets of potentially duplicate data, deduplicate inline (e.g., using a `Set` with primitive keys) before instantiating objects and adding them to an array, to reduce memory allocations and avoid redundant iteration.
## 2026-04-18 - Integer Comparison vs String Formatting for Date Checks
**Learning:** Checking if a specific date is "today" inside a high-frequency render loop (like `renderCalendar` for 365 days) by doing `date.toDateString() === new Date().toDateString()` is severely unoptimized. It forces memory allocation for a new `Date` object and string formatting for every iteration. Extracting "today" into cached module-level integer variables (`year`, `month`, `date`) and comparing them against the target date via `getDate()`, `getMonth()`, `getFullYear()` is roughly 140x faster.
**Action:** Never instantiate `new Date()` or use string formatting methods (`toDateString()`, `toISOString()`) inside hot loops for simple equality checks. Pre-calculate the current day's year, month, and date integers outside the loop (or cache them at the module level) and perform numeric equality checks.
