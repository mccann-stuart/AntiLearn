## 2025-02-18 - Prevent CDN Cache Poisoning on Error Responses
**Vulnerability:** CDN cache poisoning vulnerability via error states.
**Learning:** `applySecurityHeaders` in `worker.mjs` was checking `pathname` to determine static cache rules (e.g., `public, max-age=31536000, immutable` for `.css` files) and applying them to all responses without checking `response.status`. If a 404 Not Found error response had a pathname ending in `.css`, it inherited a long-lived cache header, resulting in CDN caching a 404 response.
**Prevention:** In functions appending cache-control headers based on route/pathname, explicitly ensure `response.status >= 400` sets `Cache-Control: no-store` instead of inheriting static rules.

## 2026-03-23 - Prevent Data Leakage in Shareable URLs
**Vulnerability:** Unintentional exposure of query parameters or session tokens via the shareable link.
**Learning:** The `buildShareableUrl` function in `public/app.js` was constructing the shareable URL using `window.location.href`. This means that any existing query parameters or hash fragments in the URL (such as tracking tokens, session IDs, or sensitive data) would be included in the generated link and shared with others.
**Prevention:** When constructing a shareable URL, always use a clean base URL composed of `window.location.origin + window.location.pathname` to ensure that only intended parameters (like the `plan` data) are included in the final URL.