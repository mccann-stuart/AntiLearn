## 2025-02-18 - Prevent CDN Cache Poisoning on Error Responses
**Vulnerability:** CDN cache poisoning vulnerability via error states.
**Learning:** `applySecurityHeaders` in `worker.mjs` was checking `pathname` to determine static cache rules (e.g., `public, max-age=31536000, immutable` for `.css` files) and applying them to all responses without checking `response.status`. If a 404 Not Found error response had a pathname ending in `.css`, it inherited a long-lived cache header, resulting in CDN caching a 404 response.
**Prevention:** In functions appending cache-control headers based on route/pathname, explicitly ensure `response.status >= 400` sets `Cache-Control: no-store` instead of inheriting static rules.
## 2025-02-18 - Prevent Unintended Data Leakage in Share URLs
**Vulnerability:** Information Disclosure / Privacy Leakage via Share URLs
**Learning:** Using `window.location.href` as the base for constructing a shareable URL preserves any existing query parameters or hash fragments the user might have arrived with, potentially leaking sensitive tracking tokens or session identifiers.
**Prevention:** Always construct shareable links from a clean base using `window.location.origin + window.location.pathname` instead of `window.location.href`.
