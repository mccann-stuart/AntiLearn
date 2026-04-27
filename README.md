# Vacation Maximiser

A simple web application to help you find the most efficient way to use your annual leave. This tool calculates the best time to book your vacation days to get the longest possible breaks by strategically combining them with public holidays and weekends.

## Features

*   **Optimal Vacation Planning**: Automatically calculates the best combination of leave blocks to maximize your time off.
*   **Location Holidays**: Supports England & Wales, Scotland, Northern Ireland, Qatar, the UAE, Saudi Arabia, Canada, and all 50 U.S. states individually.
*   **Custom Holidays**: Add your own non-working days (company shutdowns, birthdays, local events) per location.
*   **Weekend Selection**: Choose weekend patterns (Sat/Sun or Fri/Sat) per location.
*   **Interactive Calendar**: A full-year calendar view that highlights weekends, bank holidays, and your booked leave days.
*   **Customizable Allowance**: Adjust your annual leave allowance to match your employer's policy.
*   **Year Selection**: Plan your vacations for the current year and future years.
*   **Smart Insights**: Heatmap efficiency hints, bridge-day highlights, and year-over-year comparisons.
*   **Export to Calendar**: Download an iCal (.ics) file for your booked leave blocks.
*   **Persistent Plans**: Saves your plan to `localStorage` and restores it on return visits.
*   **Share Your Plan**: Generate a unique link to share your optimized leave schedule with others.

## Status (as of 2026-04-20)

*   Core optimizer, multi-location holiday logic, custom holidays, export, heatmap, year-over-year insights, and shareable plans are implemented in `public/app.js`.
*   Frontend is static in `public/` and runs without a backend.
*   International Support: Active for Qatar, UAE, Saudi Arabia, Canada, and all 50 U.S. states using automated data refreshes.
*   Security hardening: Share/localStorage plan payloads now validate real calendar dates and integer allowance/year values before reaching optimizer or export paths.
*   UI hardening: Dynamic share-button copied states preserve text-only accessible names, compact allowance fields avoid clipping three-digit values, and the custom-holiday panel is constrained to the main page width.
*   Tests: `npm test` runs unit tests across application logic, worker configuration, dataset building, security headers, and XSS prevention.
*   Deployment uses `worker.mjs` to add security headers and caching on Cloudflare, and to refresh holiday data weekly.

## Getting Started

### Local Development

To get a local copy up and running, open the `public/index.html` file in your web browser:

```bash
cd AntiLearn
open public/index.html
# or on Linux: xdg-open public/index.html
```

### Tests

```bash
npm install
npm test
```

Production dependency audit:

```bash
npm audit --omit=dev
```

### Production Deployment

This application is configured for deployment on Cloudflare Pages/Workers:

```bash
# Install Wrangler CLI (if not already installed)
pnpm add -g wrangler

# Deploy to Cloudflare
pnpm exec wrangler pages deploy public
```

## Usage

1.  **Set Your Allowance**: Enter your total annual leave allowance in the "Allowance" input field.
2.  **Select a Year**: Choose the year you want to plan for from the dropdown menu.
3.  **Choose a Location**: Pick the country/region to load its holiday calendar.
4.  **Pick Weekend Pattern**: Select Sat/Sun or Fri/Sat as your weekend.
5.  **View Recommendations**: The "Top 3 Smartest Breaks" section will automatically display the most efficient leave blocks.
6.  **Customize Your Plan**: Click on any workday in the calendar to manually book or unbook a leave day.
7.  **Reset to Optimal**: Click the "Reset Plan" button to revert to the optimal plan at any time.

## How it Works

The application uses a simple but effective algorithm to find the best leave combinations:

1.  **Holiday Data**: It starts with a list of UK bank holidays, plus a dataset-backed holiday catalog for Qatar, the UAE, Saudi Arabia, Canada, and all 50 U.S. states.
2.  **Candidate Generation**: It iterates through every workday of the year and calculates the potential time off for various leave durations (e.g., taking 3, 4, 5 days off).
3.  **Efficiency Scoring**: Each potential leave block is scored based on its efficiency (total days off / leave days used).
4.  **Combination Finding**: The algorithm then searches for the best combination of up to three non-overlapping leave blocks that fit within your allowance, prioritizing the combination that uses the most of your allowance while maximizing your total time off.

## Holiday Data Refresh

The Cloudflare Worker schedules a weekly refresh to rebuild the dataset-backed holiday catalog from Calendarific and Tallyfy. Canada and the Gulf countries use country-level data, while each U.S. state combines a shared U.S. national baseline with a state-specific Calendarific overlay. The latest dataset is stored in KV and served directly from KV, and the browser keeps a cached copy as a fallback if the network request fails.

For local development or manual refreshes, run:

```bash
calendarific=your_key pnpm run populate-kv
```

In Cloudflare, store the Calendarific key in a Secrets Store secret named `calendarific` and ensure it is bound in `wrangler.toml` via `secrets_store_secrets`.

For local dev, prefer adding `calendarific=...` to `.dev.vars` (and keep it out of git).

## Security Notes

*   Shared plan URLs are base64url-encoded JSON. The decoder rejects oversized payloads, unsupported locations/weekend presets, non-integer allowances/years, and impossible dates such as `2025-02-29`.
*   Custom holiday names are rendered with `textContent`, not HTML, and holiday dates must be real `YYYY-MM-DD` calendar dates.
*   Worker responses receive CSP, frame-denial, referrer-policy, permissions-policy, HSTS, and no-store caching on error responses.
*   Calendarific secrets must stay in Cloudflare Secrets Store or local ignored env files. Logs should not include full outbound URLs or raw secret-binding exception messages.

## Future Roadmap

We are constantly working to improve the Vacation Maximiser. Here are some of the key features we are planning to implement:

*   **Progressive Web App (PWA)**: Support for offline capability, installability, and service workers.
*   **Team Collaboration**: Functionality to overlay multiple shared plans for group coordination and finding common free time.
*   **UI Personalization**: Dark mode support and further theme customization.

For a detailed breakdown of our development plan, please see [roadmap.md](roadmap.md).

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
