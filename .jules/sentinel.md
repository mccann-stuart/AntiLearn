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
## 2026-03-25 - Prevent URL Tracking Token Leakage via Shareable URLs
**Vulnerability:** The `buildShareableUrl` function constructed a shareable URL by reading directly from `window.location.href`, meaning any extraneous tracking tokens or query parameters present in the user's URL would be included in the shared URL.
**Learning:** Reading directly from `window.location.href` for generating shareable links can unintentionally leak sensitive or tracking data (like UTM tags or session IDs).
**Prevention:** To prevent data leakage, use `window.location.origin + window.location.pathname` to construct a clean base URL before appending specific shareable parameters.
