## 2025-02-18 - Prevent CDN Cache Poisoning on Error Responses
**Vulnerability:** CDN cache poisoning vulnerability via error states.
**Learning:** `applySecurityHeaders` in `worker.mjs` was checking `pathname` to determine static cache rules (e.g., `public, max-age=31536000, immutable` for `.css` files) and applying them to all responses without checking `response.status`. If a 404 Not Found error response had a pathname ending in `.css`, it inherited a long-lived cache header, resulting in CDN caching a 404 response.
**Prevention:** In functions appending cache-control headers based on route/pathname, explicitly ensure `response.status >= 400` sets `Cache-Control: no-store` instead of inheriting static rules.
## 2026-03-29 - Prevent XSS by avoiding direct innerHTML assignment
 **Vulnerability:** Code used direct assignment to innerHTML (`.innerHTML = ''`) to clear DOM nodes.
 **Learning:** While assigning an empty string to innerHTML is not inherently exploitable, it establishes an unsafe anti-pattern that can lead to XSS if later modified to include user input.
 **Prevention:** Use `.textContent = ''` instead of `.innerHTML = ''` when clearing DOM elements to maintain safer coding habits and slightly improve performance.
## 2025-02-18 - Fix API Key Leakage in Logs
**Vulnerability:** Full URLs and raw error messages were being logged during fetch failures, potentially leaking API keys via query parameters. Custom redaction functions were used but are error-prone.
**Learning:** Relying on custom string replacement to redact secrets from URLs or error messages is brittle. If a new secret or query parameter is added, it might be missed by the redaction logic.
**Prevention:** To prevent API key leakage via query parameters in logs, never log full URLs from outgoing requests or rely on custom redaction functions. Instead, parse the URL to log strictly the hostname and pathname, and use generic error messages.
## 2026-04-09 - Prevent Data Leakage in Shareable URLs\n**Vulnerability:** The application appended the generated plan encoded payload to `window.location.href`, meaning that any arbitrary query parameters present in the user's current URL would be unintentionally included in the generated shareable link. \n**Learning:** Constructing base URLs using `window.location.href` for link generation operations presents a privacy and security risk since it blindly captures the current state, potentially including sensitive tracking parameters, tokens, or malicious inputs from a reflected source.\n**Prevention:** When generating a shareable URL that only needs specific parameters, construct a clean base URL explicitly using `window.location.origin + window.location.pathname`.
## $(date +%Y-%m-%d) - Prevent Local Storage Memory Bloat / Client-Side DoS
**Vulnerability:** The application was not enforcing its constants `MAX_CUSTOM_HOLIDAYS` and `MAX_BOOKED_DATES` at runtime when users added items, opening the application to state bloating via excessive additions which would slow down JSON.stringify/parse loops in local storage routines and cause out-of-memory errors over prolonged usage or automated abuse.
**Learning:** Checking payload limits during object initialization is insufficient. State limits must be strictly verified and bounded during every mutation (addition) to the state.
**Prevention:** Always ensure arrays or Sets exposed to unchecked insertions check against their application-defined limits (`if (size >= MAX) return;`) before pushing elements, and communicate failures to the user via toast notifications or errors rather than silently accepting unbounded inputs.

## 2026-04-20 - Validate Calendar Dates Beyond Regex Shape
**Vulnerability:** Shared URLs and localStorage payloads accepted strings that matched `YYYY-MM-DD` but were impossible dates, such as `2025-02-29`. Later `Date` parsing could overflow those strings into a different real day, causing hidden bookings to affect stats or exports.
**Learning:** Regex validation only proves shape, not calendar validity. Any date string that later reaches `Date` arithmetic must be checked for month/day bounds and leap-year correctness first.
**Prevention:** Use a strict ISO date validator for all URL, storage, custom holiday, and holiday dataset inputs before parsing with `Date` or fast `charCodeAt` helpers.
## 2026-04-20 - Require Integer Planning Numbers
**Vulnerability:** Fractional allowance or year values from shared URLs/localStorage could reach integer-indexed optimizer code and create fractional typed-array offsets or inconsistent calendar labels.
**Learning:** Numeric bounds are incomplete for state that drives array indexing, year selectors, or calendar construction. Integers need explicit `Number.isInteger` validation.
**Prevention:** Validate allowance and year values with integer checks before applying persisted or shared state.
## 2026-04-20 - Do Not Log Raw Secret Binding Exceptions
**Vulnerability:** Secret-store access errors were logged with raw exception messages. Even if current providers are safe, exception text is not a reliable boundary for secrets.
**Learning:** Secret handling should log the failed operation, not provider-controlled or secret-adjacent error details.
**Prevention:** Keep secret-binding warnings generic and continue returning an empty key on failure.
## $(date +%Y-%m-%d) - Secure Manual Environment Parsing
**Vulnerability:** A script contained custom string-parsing logic to manually read `.env` files. Manual parsing is error-prone and can improperly interpret quotes, spaces, or equals signs, potentially corrupting secrets or misconfiguring the environment.
**Learning:** Native secure loaders like `process.loadEnvFile(path)` (introduced in Node.js v20.12.0) should be utilized when available instead of reinventing the wheel with naive text manipulation, minimizing edge cases in secret parsing.
**Prevention:** Verify `typeof process.loadEnvFile === 'function'` and prioritize it over fallback manual parsing, ensuring it is not wrapped in a generic `try...catch` block to prevent swallowing missing-function `TypeError` exceptions on older Node runtimes.
