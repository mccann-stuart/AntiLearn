## 2026-02-18 - XSS in Accessibility Attributes
**Learning:** Using user input directly in `aria-label` or other attributes can lead to both security vulnerabilities (XSS if unescaped) and poor accessibility (screen readers announcing HTML tags).
**Action:** Always sanitize or strip HTML from user-generated content before using it in accessibility attributes.

## 2026-02-18 - Silent Notifications
**Learning:** Dynamic notification containers (like toasts) often miss `aria-live` attributes, causing screen readers to miss critical updates.
**Action:** Ensure all dynamic content containers (toasts, status messages) have `aria-live="polite"` or use `role="alert"`/`role="status"` on the inserted elements.

## 2026-02-18 - Skip Link Focus Management
**Learning:** When implementing skip links, the target element (e.g., a heading or container) must have `tabindex="-1"` to receive programmatic focus. Without this, the browser scrolls to the element but focus remains on the link itself, disrupting the keyboard navigation flow.
**Action:** Always ensure skip link targets have `tabindex="-1"` and appropriate focus styles (e.g., `outline: none` if visual focus is undesired).
## 2026-03-11 - Mobile Tap Feedback on Dense Grids
**Learning:** Dense, interactive UI elements (like calendar days) on mobile devices suffer from poor UX due to default tap highlights (`-webkit-tap-highlight-color`) and accidental text selection (`user-select`) when tapped rapidly. Furthermore, lack of immediate visual active states leaves users unsure if their tap registered.
**Action:** Always add `-webkit-tap-highlight-color: transparent`, `user-select: none`, `touch-action: manipulation`, and a clear `:active` state (like `transform: scale(0.95)`) to interactive grid elements to create a snappy, native-app feel.
