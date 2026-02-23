/**
 * @jest-environment jsdom
 */

describe('Security Input Validation', () => {
    let app;

    beforeEach(() => {
        jest.resetModules();
        document.body.innerHTML = `
            <div id="sticky-header"></div>
            <select id="year-select"></select>
            <select id="location-select">
                <option value="england-wales" selected>England & Wales</option>
            </select>
            <select id="weekend-select"></select>
            <input id="allowance-input" value="25">
            <div id="days-used"></div>
            <div id="days-off"></div>
            <div id="recommendations"></div>
            <div id="calendar" data-render-key=""></div>
            <div id="yoy-main"></div>
            <div id="yoy-sub"></div>
            <div id="holiday-data-status"></div>
            <form id="custom-holiday-form" class="custom-holiday-inputs">
                <input type="date" id="custom-date-input" required>
                <input type="text" id="custom-name-input" required>
                <button type="submit" id="add-custom-btn">Add</button>
            </form>
            <div id="custom-holidays-list"></div>
            <div id="toast-container"></div>
        `;
        // Mock localStorage
        Storage.prototype.getItem = jest.fn(() => null);
        Storage.prototype.setItem = jest.fn();

        // Suppress console.warn/error during tests
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});

        app = require('../public/app.js');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('rejects custom holiday names longer than 50 characters', () => {
        const longName = 'A'.repeat(51);
        const dateInput = document.getElementById('custom-date-input');
        const nameInput = document.getElementById('custom-name-input');
        const addBtn = document.getElementById('add-custom-btn');
        const toastContainer = document.getElementById('toast-container');

        dateInput.value = '2025-01-01';
        nameInput.value = longName;
        addBtn.click();

        // Check if state was updated
        const state = app.getCurrentState();
        const holidays = state.customHolidaysByLocation['england-wales'] || [];
        const addedHoliday = holidays.find(h => h.date === '2025-01-01');

        // Should NOT be added
        expect(addedHoliday).toBeUndefined();

        // Check for error toast
        const toast = toastContainer.querySelector('.toast.error');
        expect(toast).not.toBeNull();
        expect(toast.textContent).toContain('too long');
    });

    test('rejects invalid date formats', () => {
        const dateInput = document.getElementById('custom-date-input');
        const nameInput = document.getElementById('custom-name-input');
        const addBtn = document.getElementById('add-custom-btn');
        const toastContainer = document.getElementById('toast-container');

        // Simulate invalid date input
        dateInput.type = 'text';
        dateInput.value = 'not-a-date';
        nameInput.value = 'My Holiday';
        addBtn.click();

        const state = app.getCurrentState();
        const holidays = state.customHolidaysByLocation['england-wales'] || [];
        const addedHoliday = holidays.find(h => h.name === 'My Holiday');

        // Should NOT be added
        expect(addedHoliday).toBeUndefined();

        // Check for error toast
        const toast = toastContainer.querySelector('.toast.error');
        expect(toast).not.toBeNull();
        expect(toast.textContent).toContain('Invalid date format');
    });
});
