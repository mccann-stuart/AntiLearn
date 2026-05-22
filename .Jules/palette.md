## 2025-02-23 - Fixed WCAG 1.4.1 Color-Only Error State in Stats
**Learning:** The "Days Used" stat card indicated an exceeded allowance solely by changing the text color to red (`.error` class). This violated WCAG 1.4.1 Use of Color, making the error invisible to colorblind users or screen readers not announcing color changes.
**Action:** Added a visual `⚠️` icon next to the number when the allowance is exceeded to ensure the error state is conveyed through both color and form.

## 2026-05-22 - Persistent Context on Mobile Scroll
**Learning:** Hiding the main statistics container (Allowance, Days Used, etc.) during mobile scroll to save space removes critical user context during active interactions (like date selection).
**Action:** Transformed the stats container into a condensed "mini-stats" view that persists within the sticky header during scroll, maintaining context without sacrificing vertical screen real estate.
