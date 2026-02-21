/**
 * @jest-environment jsdom
 */

const app = require('../public/app.js');

describe('Allowance Feedback Logic', () => {
    // Mock DOM elements required by renderCalendar and showToast
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="toast-container"></div>
            <div id="calendar"></div>
            <div id="days-used"></div>
            <div id="days-off"></div>
            <div id="calendar-year-title"></div>
            <div id="recommendations"></div>
            <div id="yoy-main"></div>
            <div id="yoy-sub"></div>
            <div id="holiday-data-status"></div>
            <div id="custom-holidays-list"></div>
        `;

        // Reset to a clean state before each test
        // year=2023, region='england-wales', holidays=[], booked=[], weekend='sat-sun', allowance=5
        app.setTestState(2023, 'england-wales', [], [], 'sat-sun', 5);
    });

    test('Displays success toast when allowance is exactly reached', () => {
        // Allowance is 5. Book 4 days initially.
        app.setTestState(2023, 'england-wales', [], ['2023-01-02', '2023-01-03', '2023-01-04', '2023-01-05'], 'sat-sun', 5);

        app.renderCalendar();

        // Find the 6th of Jan (Friday) which is a workday and not booked
        const dayElement = document.querySelector('.day[data-date="2023-01-06"]');
        expect(dayElement).not.toBeNull();

        // Click it to book the 5th day (reaching allowance)
        dayElement.click();

        const toastContainer = document.getElementById('toast-container');
        expect(toastContainer.textContent).toContain("Perfect! You've used all 5 days of your allowance.");
        expect(toastContainer.textContent).toContain("✅");
    });

    test('Displays warning toast when allowance is exceeded', () => {
        // Allowance is 5. Book 5 days initially.
        app.setTestState(2023, 'england-wales', [], ['2023-01-02', '2023-01-03', '2023-01-04', '2023-01-05', '2023-01-06'], 'sat-sun', 5);

        app.renderCalendar();

        // Find the 9th of Jan (Monday)
        const dayElement = document.querySelector('.day[data-date="2023-01-09"]');
        expect(dayElement).not.toBeNull();

        // Click it to book the 6th day (exceeding allowance)
        dayElement.click();

        const toastContainer = document.getElementById('toast-container');
        expect(toastContainer.textContent).toContain("Note: You've exceeded your allowance (6/5).");
        expect(toastContainer.textContent).toContain("ℹ️");
    });

    test('Does not display toast when under allowance', () => {
        // Allowance is 5. Book 1 day initially.
        app.setTestState(2023, 'england-wales', [], ['2023-01-02'], 'sat-sun', 5);

        app.renderCalendar();

        // Find the 3rd of Jan
        const dayElement = document.querySelector('.day[data-date="2023-01-03"]');

        // Click to book 2nd day (still under 5)
        dayElement.click();

        const toastContainer = document.getElementById('toast-container');
        expect(toastContainer.innerHTML).toBe('');
    });

    test('Does not display toast when removing a booked day', () => {
        // Allowance is 5. Book 5 days initially.
        app.setTestState(2023, 'england-wales', [], ['2023-01-02', '2023-01-03', '2023-01-04', '2023-01-05', '2023-01-06'], 'sat-sun', 5);

        app.renderCalendar();

        // Unbook the 6th of Jan
        const dayElement = document.querySelector('.day[data-date="2023-01-06"]');
        dayElement.click();

        const toastContainer = document.getElementById('toast-container');
        expect(toastContainer.innerHTML).toBe('');
    });
});
