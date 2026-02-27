## 2025-02-18 - [Optimizing Date Formatting]
**Learning:** `Date.prototype.toLocaleDateString` with an options object is significantly slower (~50x) than `Intl.DateTimeFormat.prototype.format` when called repeatedly, because it instantiates a new formatter on every call.
**Action:** For date formatting in loops or high-frequency render functions (like recommendation lists), always create a shared `Intl.DateTimeFormat` instance at the module level and reuse it.
