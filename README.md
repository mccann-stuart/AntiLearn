# UK Vacation Maximiser

A simple web application to help you find the most efficient way to use your annual leave in the UK. This tool calculates the best time to book your vacation days to get the longest possible breaks by strategically combining them with bank holidays and weekends.

## Features

*   **Optimal Vacation Planning**: Automatically calculates the best combination of leave blocks to maximize your time off.
*   **Regional Holidays**: Supports England & Wales, Scotland, and Northern Ireland bank holidays.
*   **Custom Holidays**: Add your own non-working days (company shutdowns, birthdays, local events).
*   **Interactive Calendar**: A full-year calendar view that highlights weekends, bank holidays, and your booked leave days.
*   **Customizable Allowance**: Adjust your annual leave allowance to match your employer's policy.
*   **Year Selection**: Plan your vacations for the current year and future years.
*   **Smart Insights**: Heatmap efficiency hints, bridge-day highlights, and year-over-year comparisons.
*   **Export to Calendar**: Download an iCal (.ics) file for your booked leave blocks.
*   **Persistent Plans**: Saves your plan to `localStorage` and restores it on return visits.

## Status (as of 2026-02-14)

*   Core optimizer, multi-region holiday logic, custom holidays, export, heatmap, and year-over-year insights are implemented in `public/app.js`.
*   Frontend is static in `public/` and runs without a backend.
*   Tests: `npm test` runs 14 unit tests across date utilities, holiday logic, optimization, and insights. Jest logs a console error because the app bootstraps without a DOM when imported in tests, but the suite passes.
*   Deployment uses `worker.js` to add security headers and caching on Cloudflare.

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
3.  **View Recommendations**: The "Top 3 Smartest Breaks" section will automatically display the most efficient leave blocks.
4.  **Customize Your Plan**: Click on any workday in the calendar to manually book or unbook a leave day.
5.  **Reset to Optimal**: Click the "Reset Plan" button to revert to the optimal plan at any time.

## How it Works

The application uses a simple but effective algorithm to find the best leave combinations:

1.  **Holiday Data**: It starts with a list of UK bank holidays.
2.  **Candidate Generation**: It iterates through every workday of the year and calculates the potential time off for various leave durations (e.g., taking 3, 4, 5 days off).
3.  **Efficiency Scoring**: Each potential leave block is scored based on its efficiency (total days off / leave days used).
4.  **Combination Finding**: The algorithm then searches for the best combination of up to three non-overlapping leave blocks that fit within your allowance, prioritizing the combination that uses the most of your allowance while maximizing your total time off.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
