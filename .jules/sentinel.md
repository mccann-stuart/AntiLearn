## 2025-02-18 - Prevent CDN Cache Poisoning on Error Responses
**Vulnerability:** CDN cache poisoning vulnerability via error states.
**Learning:** `applySecurityHeaders` in `worker.mjs` was checking `pathname` to determine static cache rules (e.g., `public, max-age=31536000, immutable` for `.css` files) and applying them to all responses without checking `response.status`. If a 404 Not Found error response had a pathname ending in `.css`, it inherited a long-lived cache header, resulting in CDN caching a 404 response.
**Prevention:** In functions appending cache-control headers based on route/pathname, explicitly ensure `response.status >= 400` sets `Cache-Control: no-store` instead of inheriting static rules.
## $(date +%Y-%m-%d) - Prevent XSS by avoiding direct innerHTML assignment
 **Vulnerability:** Code used direct assignment to innerHTML (`.innerHTML = ''`) to clear DOM nodes.
 **Learning:** While assigning an empty string to innerHTML is not inherently exploitable, it establishes an unsafe anti-pattern that can lead to XSS if later modified to include user input.
 **Prevention:** Use `.textContent = ''` instead of `.innerHTML = ''` when clearing DOM elements to maintain safer coding habits and slightly improve performance.
## 2025-02-18 - Fix API Key Leakage in Logs
**Vulnerability:** Full URLs and raw error messages were being logged during fetch failures, potentially leaking API keys via query parameters. Custom redaction functions were used but are error-prone.
**Learning:** Relying on custom string replacement to redact secrets from URLs or error messages is brittle. If a new secret or query parameter is added, it might be missed by the redaction logic.
**Prevention:** To prevent API key leakage via query parameters in logs, never log full URLs from outgoing requests or rely on custom redaction functions. Instead, parse the URL to log strictly the hostname and pathname, and use generic error messages.

## 2025-02-24 - Prevent XSS by Avoiding `.innerHTML` for DOM State Manipulation
**Vulnerability:** UI code temporarily replaced a button's content using `.innerHTML = '<span aria-hidden="true">✅</span> Copied!'` and restored the original state by reading and writing `.innerHTML`.
**Learning:** While the hardcoded string wasn't immediately exploitable, reading `.innerHTML` and blindly writing it back is a dangerous pattern. If any part of the original DOM subtree contained unescaped user input (even if previously safe as text nodes), re-evaluating it as HTML via `.innerHTML` creates a DOM-based XSS vector.
**Prevention:** In UI interactions where original button content is temporarily replaced, store the original DOM child nodes (e.g., using `Array.from(element.childNodes)`) and restore them via `.appendChild()`. Create new elements via `.createElement()` and `.createTextNode()` rather than string templates to completely avoid HTML parsing.