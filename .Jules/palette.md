## 2025-02-23 - Fixed WCAG 1.4.1 Color-Only Error State in Stats
**Learning:** The "Days Used" stat card indicated an exceeded allowance solely by changing the text color to red (`.error` class). This violated WCAG 1.4.1 Use of Color, making the error invisible to colorblind users or screen readers not announcing color changes.
**Action:** Added a visual `⚠️` icon next to the number when the allowance is exceeded to ensure the error state is conveyed through both color and form.
