## 2025-02-18 - [Optimizing Date Formatting]
**Learning:** `Date.prototype.toLocaleDateString` with an options object is significantly slower (~50x) than `Intl.DateTimeFormat.prototype.format` when called repeatedly, because it instantiates a new formatter on every call.
**Action:** For date formatting in loops or high-frequency render functions (like recommendation lists), always create a shared `Intl.DateTimeFormat` instance at the module level and reuse it.

## 2025-02-18 - [Bitwise String Concatenation Replacement]
**Learning:** Constructing string keys inside high-frequency loops (e.g., `generateAllCandidates` deduplication) causes noticeable garbage collection overhead. Since indices are well within limits (< 366 for days of year), combining indices into a single integer using bitwise shifts `(startIdx << 16) | endIdx` yielded a measurable performance improvement (~10%).
**Action:** Use 32-bit integer keys (bitwise construction) instead of string interpolation for map/set deduplication when tracking indices or values that comfortably fit in a 16-bit range.

## 2025-02-18 - [Array Clone Performance]
**Learning:** When performing shallow cloning of arrays (e.g., prior to sorting candidates), using `.slice()` instead of the spread syntax `[...arr]` proved slightly more performant, reducing execution time overhead.
**Action:** Use `Array.prototype.slice()` instead of spread syntax for performance-sensitive array cloning in large loops or data transformations.
