## 2025-02-18 - Prevent CDN Cache Poisoning on Error Responses
**Vulnerability:** CDN cache poisoning vulnerability via error states.
**Learning:** `applySecurityHeaders` in `worker.mjs` was checking `pathname` to determine static cache rules (e.g., `public, max-age=31536000, immutable` for `.css` files) and applying them to all responses without checking `response.status`. If a 404 Not Found error response had a pathname ending in `.css`, it inherited a long-lived cache header, resulting in CDN caching a 404 response.
**Prevention:** In functions appending cache-control headers based on route/pathname, explicitly ensure `response.status >= 400` sets `Cache-Control: no-store` instead of inheriting static rules.
## 2025-02-18 - Prevent Data Leakage via Unsafe URL Generation
**Vulnerability:** Extraneous query parameters (e.g., tracking tokens, secrets, or IDs) from `window.location.href` could be unintentionally copied and leaked to others when sharing application URLs.
**Learning:** Initializing a `URL` object with the full `window.location.href` copies over all existing query parameters to the new shareable link, resulting in unintended data exposure.
**Prevention:** Construct clean base URLs for sharing directly from `window.location.origin + window.location.pathname` rather than `window.location.href`.
