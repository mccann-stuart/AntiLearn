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

## 2026-02-18 - [Local Storage DoS and Injection]
**Vulnerability:** The application loaded the `bookedDates` state from `localStorage` without any validation or sanitization, directly passing it into application state (`Set(savedState.bookedDates)`). This allowed injection of invalid data types or excessively large arrays that could crash the application or cause Denial of Service (DoS) during iteration/rendering logic.
**Learning:** Data restored from local storage (`localStorage`) must be treated as untrusted user input, just like URL parameters or form submissions. Client-side storage is entirely under the control of the user (or a malicious script running in the context of the user's browser).
**Prevention:** Always validate and sanitize data retrieved from `localStorage` before using it in application logic. Enforce type checks, format validation (e.g., regex for dates), and length limits (truncation) on arrays or strings to prevent resource exhaustion.
