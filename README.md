# UK Vacation Maximiser

A simple web application to help you find the most efficient way to use your annual leave in the UK. This tool calculates the best time to book your vacation days to get the longest possible breaks by strategically combining them with bank holidays and weekends.

## Features

*   **Optimal Vacation Planning**: Automatically calculates the best combination of leave blocks to maximize your time off.
*   **Interactive Calendar**: A full-year calendar view that highlights weekends, bank holidays, and your booked leave days.
*   **Customizable Allowance**: Adjust your annual leave allowance to match your employer's policy.
*   **Year Selection**: Plan your vacations for the current year and future years.
*   **Real-time Analysis**: Get instant feedback on your leave plan, including the total number of days off and the efficiency of your choices.

## Getting Started

To get a local copy up and running, simply clone the repository and open the `index.html` file in your web browser.

```bash
git clone https://github.com/your-username/uk-vacation-maximiser.git
cd uk-vacation-maximiser
```

Then, open the `index.html` file in your browser of choice.

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
