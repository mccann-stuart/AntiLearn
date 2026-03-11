## 2026-02-18 - [API Key Leakage in Error Logs]
**Vulnerability:** External API calls (like to Calendarific) include API keys in query parameters. When `fetch` fails, the error message often contains the full URL with the secret. This was being logged to `console.error`.
**Learning:** Default error logging for `fetch` operations can inadvertently expose secrets if they are part of the URL.
**Prevention:** Always redact sensitive query parameters from URLs before logging them. Wrap `fetch` calls in try-catch blocks to sanitize error messages before re-throwing or logging.

## 2026-02-18 - [Permissions-Policy Default Deny]
**Vulnerability:** By default, browsers may allow access to sensitive hardware (accelerometer, gyroscope, USB) unless explicitly restricted.
**Learning:** Modern browsers expose powerful hardware APIs. A strict `Permissions-Policy` header reduces the attack surface for potential XSS exploitation.
**Prevention:** Explicitly disable unused features using the `Permissions-Policy` header (e.g., `accelerometer=(), usb=(), payment=()`).

## 2026-02-18 - [Unrestricted HTTP Methods]
**Vulnerability:** The Cloudflare Worker allowed `POST`, `PUT`, `DELETE` requests to static endpoints and API routes, even though they were only intended for `GET` retrieval.
**Learning:** Cloudflare Workers (and many serverless functions) handle all HTTP methods by default unless explicitly checked. This increases the attack surface for potential future vulnerabilities or abuse.
**Prevention:** Explicitly check `request.method` at the entry point and return `405 Method Not Allowed` for unexpected methods.

## 2026-02-18 - [DOM-based XSS via innerHTML]
**Vulnerability:** Application logic in `public/app.js` used `innerHTML` to dynamically render user-facing elements like recommendation cards and error messages, creating a DOM-based Cross-Site Scripting (XSS) risk if those strings contained unsanitized user input or unvalidated data.
**Learning:** Even internal formatting strings can be manipulated to introduce XSS. `innerHTML` should strictly be avoided for generating dynamic HTML structures.
**Prevention:** Use native DOM operations (`document.createElement`, `textContent`, `appendChild`) to construct elements safely. `innerHTML` should only be used to clear existing content (e.g., `element.innerHTML = ''`).

## 2026-02-18 - [Missing Security Headers on Error Responses]
**Vulnerability:** In `worker.mjs`, the global `catch` block returned a plain 500 error response without routing it through `applySecurityHeaders`.
**Learning:** Even static error responses (like a 500 Internal Server Error) must include security headers (CSP, HSTS, X-Content-Type-Options) to fulfill defense in depth and ensure that attackers cannot bypass browser policies by forcing the application into an error state.
**Prevention:** Always ensure that error-handling code paths construct a secure response and route through the same header-application logic as successful responses, while explicitly setting `Cache-Control: no-store` to prevent CDN/browser caching of error states.## 2026-03-11 - [DoS via Large Encoded Payloads]
**Vulnerability:** The `decodePlanString` function accepted base64url encoded payloads of arbitrary length. A very large string could cause memory exhaustion and CPU spikes during string replacement, base64 decoding, and JSON parsing.
**Learning:** Even with downstream array truncation (like limiting to 1000 booked dates), the initial parsing of an overly large payload can be used for a Denial of Service attack.
**Prevention:** Always enforce a hard length limit on incoming encoded strings before attempting to parse or decode them, aligned with the maximum expected legitimate payload size.
