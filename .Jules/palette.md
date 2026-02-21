## 2026-02-18 - XSS in Accessibility Attributes
**Learning:** Using user input directly in `aria-label` or other attributes can lead to both security vulnerabilities (XSS if unescaped) and poor accessibility (screen readers announcing HTML tags).
**Action:** Always sanitize or strip HTML from user-generated content before using it in accessibility attributes.

## 2026-02-18 - Silent Notifications
**Learning:** Dynamic notification containers (like toasts) often miss `aria-live` attributes, causing screen readers to miss critical updates.
**Action:** Ensure all dynamic content containers (toasts, status messages) have `aria-live="polite"` or use `role="alert"`/`role="status"` on the inserted elements.
