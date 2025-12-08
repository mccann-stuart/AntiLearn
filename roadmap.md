# Product Roadmap: UK Vacation Maximiser

This document outlines the strategic plan for the next four major development epics to enhance the UK Vacation Maximiser application.

## Epic 1: Regional Support & Customization
**Goal:** Expand the user base by supporting specific holidays for different UK regions and international locations, and allowing user-specific customization.

*   **Feature: Multi-Region Support**
    *   Add a dropdown to select regions: England/Wales (current), Scotland, and Northern Ireland.
    *   Update holiday logic to account for regional differences (e.g., St Andrew's Day in Scotland, St Patrick's Day in NI).
*   **Feature: Custom Holiday Input**
    *   Allow users to manually add dates as "holidays" (e.g., company-specific shutdowns, local observances).
    *   These dates should be treated as non-working days by the optimizer.

## Epic 2: Persistence & Data Portability
**Goal:** Transform the tool from a single-session calculator into a persistent planning aid.

*   **Feature: Local Storage Persistence**
    *   Save the user's selected allowance, year, and booked dates to the browser's `localStorage`.
    *   Automatically restore the plan when the user revisits the site.
*   **Feature: Export to Calendar (.ics)**
    *   Generate a standard iCal (.ics) file containing the booked leave blocks.
    *   Allow users to download and import their optimized plan into Google Calendar, Outlook, or Apple Calendar.

## Epic 3: Advanced Leave Management
**Goal:** Support more complex real-world employment scenarios beyond standard full-time Mon-Fri schedules.

*   **Feature: Half-Day Leave Booking**
    *   Allow users to book 0.5 days of leave.
    *   Update the algorithm to handle fractional leave balances.
*   **Feature: Custom Work Schedule**
    *   Support non-standard working weeks (e.g., 4-day work week, or working weekends).
    *   Allow users to define which days of the week are "workdays" for them.

## Epic 4: Smart Insights & Visualization
**Goal:** Improve decision-making confidence by visually guiding users to the best opportunities.

*   **Feature: Efficiency Heatmap**
    *   Color-code the calendar days based on their potential "efficiency" if booked.
    *   Highlight "Bridge Days" (single days that bridge two non-working periods) visually on the calendar.
*   **Feature: Year-over-Year Comparison**
    *   Show a comparison metric: "2025 offers 15% more consecutive days off than 2024."
    *   Help users decide whether to carry over leave (if applicable) or use it now.
