## 2025-02-18 - Prevent CDN Cache Poisoning on Error Responses
**Vulnerability:** CDN cache poisoning vulnerability via error states.
**Learning:** `applySecurityHeaders` in `worker.mjs` was checking `pathname` to determine static cache rules (e.g., `public, max-age=31536000, immutable` for `.css` files) and applying them to all responses without checking `response.status`. If a 404 Not Found error response had a pathname ending in `.css`, it inherited a long-lived cache header, resulting in CDN caching a 404 response.
**Prevention:** In functions appending cache-control headers based on route/pathname, explicitly ensure `response.status >= 400` sets `Cache-Control: no-store` instead of inheriting static rules.
## 2026-03-28 - Prevent XSS by avoiding direct innerHTML assignment
 **Vulnerability:** Code used direct assignment to innerHTML (`.innerHTML = ''`) to clear DOM nodes.
 **Learning:** While assigning an empty string to innerHTML is not inherently exploitable, it establishes an unsafe anti-pattern that can lead to XSS if later modified to include user input.
 **Prevention:** Use `.textContent = ''` instead of `.innerHTML = ''` when clearing DOM elements to maintain safer coding habits and slightly improve performance.
## 2025-02-18 - Fix API Key Leakage in Logs
**Vulnerability:** Full URLs and raw error messages were being logged during fetch failures, potentially leaking API keys via query parameters. Custom redaction functions were used but are error-prone.
**Learning:** Relying on custom string replacement to redact secrets from URLs or error messages is brittle. If a new secret or query parameter is added, it might be missed by the redaction logic.
**Prevention:** To prevent API key leakage via query parameters in logs, never log full URLs from outgoing requests or rely on custom redaction functions. Instead, parse the URL to log strictly the hostname and pathname, and use generic error messages.
## 2026-03-28 - Prevent Data Leakage via Shareable URLs
**Vulnerability:** Generating shareable URLs using `window.location.href` could unintentionally include existing tracking tokens, session IDs, or other extraneous query parameters present in the user's current URL.
**Learning:** Copying the full current URL as the base for a new shareable link risks propagating sensitive or unintended state data from query parameters or fragments to the recipient.
**Prevention:** Construct clean base URLs using strictly the origin and pathname (e.g., `window.location.origin + window.location.pathname`) rather than reading directly from `window.location.href` when generating shareable links.
