## 2025-02-18 - [Optimizing Date Formatting]
**Learning:** `Date.prototype.toLocaleDateString` with an options object is significantly slower (~50x) than `Intl.DateTimeFormat.prototype.format` when called repeatedly, because it instantiates a new formatter on every call.
**Action:** For date formatting in loops or high-frequency render functions (like recommendation lists), always create a shared `Intl.DateTimeFormat` instance at the module level and reuse it.

## 2025-02-18 - Fast Object Deduplication
**Learning:** O(N) array loops that perform deduplication using `Set` with string keys (`${startIdx}-${endIdx}`) incur significant overhead due to constant string allocation.
**Action:** Deduplication can be performed faster by converting multiple small numeric coordinate bounds into a single 32-bit integer key using bitwise shifting (`(startIdx << 16) | endIdx`), bypassing string operations altogether. Use `.slice()` instead of `[...arr]` before `.sort()` to avoid array spread overhead.
