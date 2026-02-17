# Vacation Maximiser

A simple web application to help you find the most efficient way to use your annual leave. This tool calculates the best time to book your vacation days to get the longest possible breaks by strategically combining them with public holidays and weekends.

## Features

*   **Optimal Vacation Planning**: Automatically calculates the best combination of leave blocks to maximize your time off.
*   **Location Holidays**: Supports England & Wales, Scotland, Northern Ireland, Qatar, and the UAE.
*   **Custom Holidays**: Add your own non-working days (company shutdowns, birthdays, local events) per location.
*   **Weekend Selection**: Choose weekend patterns (Sat/Sun or Fri/Sat) per location.
*   **Interactive Calendar**: A full-year calendar view that highlights weekends, bank holidays, and your booked leave days.
*   **Customizable Allowance**: Adjust your annual leave allowance to match your employer's policy.
*   **Year Selection**: Plan your vacations for the current year and future years.
*   **Smart Insights**: Heatmap efficiency hints, bridge-day highlights, and year-over-year comparisons.
*   **Export to Calendar**: Download an iCal (.ics) file for your booked leave blocks.
*   **Persistent Plans**: Saves your plan to `localStorage` and restores it on return visits.
*   **Share Your Plan**: Generate a unique link to share your optimized leave schedule with others.

## Status (as of 2026-02-18)

*   Core optimizer, multi-location holiday logic, custom holidays, export, heatmap, year-over-year insights, and shareable plans are implemented in `public/app.js`.
*   Frontend is static in `public/` and runs without a backend.
*   Tests: `npm test` runs unit tests across application logic, worker configuration, security headers, and XSS prevention.
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

### Production Deployment

This application is configured for deployment on Cloudflare Pages/Workers:

```bash
# Install Wrangler CLI (if not already installed)
npm install -g wrangler

# Deploy to Cloudflare
npx wrangler pages deploy public
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

1.  **Holiday Data**: It starts with a list of UK bank holidays, plus a holiday dataset for Qatar and the UAE.
2.  **Candidate Generation**: It iterates through every workday of the year and calculates the potential time off for various leave durations (e.g., taking 3, 4, 5 days off).
3.  **Efficiency Scoring**: Each potential leave block is scored based on its efficiency (total days off / leave days used).
4.  **Combination Finding**: The algorithm then searches for the best combination of up to three non-overlapping leave blocks that fit within your allowance, prioritizing the combination that uses the most of your allowance while maximizing your total time off.

## Holiday Data Refresh

The Cloudflare Worker schedules a weekly refresh (Monday 03:00 UTC) to rebuild the Qatar/UAE holiday dataset from Calendarific and Tallyfy, preferring Calendarific on overlapping dates. The latest dataset is stored in KV and served from `public/data/holidays.json` if KV is empty.

For local development or manual refreshes, run:

```bash
CALENDARIFIC_API_KEY=your_key node scripts/update_holidays.js
```

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
