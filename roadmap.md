# Product Roadmap: Vacation Maximiser

This document outlines the strategic plan for the next major development epics to enhance the UK Vacation Maximiser application.

## Status Summary (as of 2026-04-20)

*   Implemented: regional holidays (England & Wales, Scotland, Northern Ireland), dataset-backed holidays for Qatar/UAE/Saudi Arabia/Canada and all 50 U.S. states, custom holidays, localStorage persistence, iCal export, heatmap/bridge-day insights, year-over-year comparison, and shareable plan links.
*   Security hardening: share/localStorage payloads reject impossible dates, fractional allowances, and fractional years before they can affect optimizer, stats, or export output.
*   UI polish: copied share-button states keep emoji hidden from assistive names, compact allowance display supports three-digit values, and the custom holiday panel now aligns with the main content width.
*   Tests: Jest suite covers application logic, dataset building, worker configuration, security headers, XSS prevention, plan decoding, and share-button accessibility behavior.
*   Pending: half-day leave, custom work schedules, and school holidays overlay.

## Epic 1: Regional Support & Customization (Completed)
**Goal:** Expand the user base by supporting specific holidays for different UK regions and international locations, and allowing user-specific customization.

*   **Feature: Multi-Region Support (Completed)**
    *   Add a dropdown to select regions: England/Wales, Scotland, and Northern Ireland.
    *   Update holiday logic to account for regional differences.
*   **Feature: International Support (Completed)**
    *   Add support for Qatar, UAE, Saudi Arabia, Canada, and all 50 U.S. states.
    *   Implement automated data fetching for international holidays.
*   **Feature: Custom Holiday Input (Completed)**
    *   Allow users to manually add dates as "holidays" (e.g., company-specific shutdowns, local observances).
    *   These dates should be treated as non-working days by the optimizer.

## Epic 2: Persistence & Data Portability (Completed)
**Goal:** Transform the tool from a single-session calculator into a persistent planning aid.

*   **Feature: Local Storage Persistence (Completed)**
    *   Save the user's selected allowance, year, and booked dates to the browser's `localStorage`.
    *   Automatically restore the plan when the user revisits the site.
*   **Feature: Export to Calendar (.ics) (Completed)**
    *   Generate a standard iCal (.ics) file containing the booked leave blocks.
    *   Allow users to download and import their optimized plan into Google Calendar, Outlook, or Apple Calendar.

## Epic 3: Advanced Leave Management (Planned)
**Goal:** Support more complex real-world employment scenarios beyond standard full-time Mon-Fri schedules.

*   **Feature: Half-Day Leave Booking**
    *   Allow users to book 0.5 days of leave.
    *   Update the algorithm to handle fractional leave balances.
*   **Feature: Custom Work Schedule**
    *   Support non-standard working weeks (e.g., 4-day work week, or working weekends).
    *   Allow users to define which days of the week are "workdays" for them.

## Epic 4: Smart Insights & Visualization (Completed)
**Goal:** Improve decision-making confidence by visually guiding users to the best opportunities.

*   **Feature: Efficiency Heatmap**
    *   Color-code the calendar days based on their potential "efficiency" if booked.
    *   Highlight "Bridge Days" (single days that bridge two non-working periods) visually on the calendar.
*   **Feature: Year-over-Year Comparison**
    *   Show a comparison metric: "2025 offers 15% more consecutive days off than 2024."
    *   Help users decide whether to carry over leave (if applicable) or use it now.

## Epic 5: Test & Clean Up (In Progress)
**Goal:** Ensure code quality, reliability, and maintainability.

*   **Feature: Comprehensive Unit Tests (Completed)**
    *   Expand test coverage for logic, especially holiday calculations and optimization algorithms.
    *   Added tests for worker configuration, security headers, XSS prevention, strict date validation, and share-button accessibility state.
*   **Feature: Security Input Validation (Completed)**
    *   Validate shared plan and localStorage calendar dates as real dates, not only strings matching `YYYY-MM-DD`.
    *   Require integer allowance and year values before optimizer code allocates integer-indexed DP tables.
    *   Keep Calendarific secret values and raw secret-binding errors out of logs.
*   **Feature: Code Refactoring & Documentation (In Progress)**
    *   Refactor code into smaller modules if possible.
    *   Ensure JSDoc is complete and accurate.
    *   Remove any unused code.
*   **Feature: UI/UX Polish (In Progress)**
    *   Review accessibility (ARIA labels, contrast).
    *   Ensure responsive design works well on mobile.
    *   Keep dynamic button labels structurally equivalent to their initial accessible markup.

## Epic 6: Enhanced Personalization & Sharing (In Progress)
**Goal:** Allow users to share their plans and integrate with external factors like school holidays.

*   **Feature: Shareable Plan Links (Completed)**
    *   Generate a unique URL that encodes the current plan (region, allowance, booked dates).
    *   Allow users to share their optimized plan with colleagues/friends.
*   **Feature: School Holidays Overlay**
    *   Overlay school term dates (potentially via an API or static data for major UK regions) to help parents plan around (or avoid) school holidays.

## Epic 7: Progressive Web App (PWA) (Planned)
**Goal:** Make the application installable and capable of working offline.

*   **Feature: Offline Support**
    *   Implement a service worker to cache the application shell and critical assets.
    *   Allow the app to load and function (view/edit plan) without an internet connection.
*   **Feature: Installability**
    *   Create a Web App Manifest.
    *   Allow users to install the app on their home screen (mobile and desktop).

## Epic 8: Team Collaboration (Planned)
**Goal:** Enable groups of people to coordinate their time off.

*   **Feature: Plan Overlay**
    *   Allow users to import a shared plan link from another user.
    *   Visualize multiple plans on the same calendar to identify overlapping free time or conflicts.
*   **Feature: "Best Time for Group"**
    *   Algorithmically suggest the best dates for a group trip based on everyone's allowances and constraints.

## Epic 9: UI Personalization (Planned)
**Goal:** Allow users to customize the look and feel of the application.

*   **Feature: Dark Mode**
    *   Implement a system-aware dark theme.
    *   Add a manual toggle to switch between light and dark modes.
*   **Feature: Theme Customization**
    *   Allow users to choose accent colors for the calendar and UI elements.
