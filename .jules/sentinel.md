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

## 2026-02-18 - [Prototype Pollution via Unsafe Property Access]
**Vulnerability:** The application was vulnerable to prototype pollution because it used `WEEKEND_PRESETS[pattern]` to validate whether an arbitrary string `pattern` (e.g., from the URL or local storage) was a valid key. If `pattern` was `"constructor"` or `"__proto__"`, the check would pass because those properties exist on the Object prototype, causing unexpected behavior and bypassing intended validation.
**Learning:** Checking for property existence using bracket notation directly on an object (`obj[key]`) is unsafe when `key` comes from user input, as it will traverse the prototype chain.
**Prevention:** Use `Object.prototype.hasOwnProperty.call(obj, key)` to safely check if a key exists exclusively as an own property of the object, ignoring inherited properties from the prototype chain.
