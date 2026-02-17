## 2026-02-18 - XSS in Accessibility Attributes
**Learning:** Using user input directly in `aria-label` or other attributes can lead to both security vulnerabilities (XSS if unescaped) and poor accessibility (screen readers announcing HTML tags).
**Action:** Always sanitize or strip HTML from user-generated content before using it in accessibility attributes.
