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

    test('renders Canada and all 50 U.S. states in the location selector', () => {
        const locationSelect = document.getElementById('location-select');
        const options = Array.from(locationSelect.querySelectorAll('option'));
        const northAmericaGroup = Array.from(locationSelect.querySelectorAll('optgroup'))
            .find((optgroup) => optgroup.label === 'North America');
        const northAmericaLabels = northAmericaGroup
            ? Array.from(northAmericaGroup.querySelectorAll('option')).map((option) => option.textContent)
            : [];

        expect(options).toHaveLength(57);
        expect(options.map((option) => option.value)).toEqual(
            expect.arrayContaining(['canada', 'us-california', 'us-new-york', 'us-wyoming'])
        );
        expect(northAmericaLabels[0]).toBe('Canada');
        expect(northAmericaLabels[northAmericaLabels.length - 1]).toBe('Wyoming');
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

    test('rejects adding custom holidays beyond MAX_CUSTOM_HOLIDAYS limit', () => {
        const MAX_CUSTOM_HOLIDAYS = 50;
        const dateInput = document.getElementById('custom-date-input');
        const nameInput = document.getElementById('custom-name-input');
        const addBtn = document.getElementById('add-custom-btn');
        const toastContainer = document.getElementById('toast-container');

        // Add exactly MAX_CUSTOM_HOLIDAYS valid holidays
        for (let i = 0; i < MAX_CUSTOM_HOLIDAYS; i++) {
            // Need unique dates for all 50 items. Month 1 has 31 days, so we spill into month 2
            const month = i < 28 ? 1 : 2;
            const day = i < 28 ? i + 1 : (i - 28) + 1;
            const dateStr = `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dateInput.value = dateStr;
            nameInput.value = `Holiday ${i}`;
            addBtn.click();

            // clear toast
            toastContainer.innerHTML = '';
        }

        const stateBefore = app.getCurrentState();
        expect(stateBefore.customHolidaysByLocation['england-wales'] || []).toHaveLength(MAX_CUSTOM_HOLIDAYS);

        // Attempt to add one more
        dateInput.value = '2025-12-31';
        nameInput.value = 'Too Many Holidays';
        addBtn.click();

        const stateAfter = app.getCurrentState();
        expect(stateAfter.customHolidaysByLocation['england-wales'] || []).toHaveLength(MAX_CUSTOM_HOLIDAYS);

        const toast = toastContainer.querySelector('.toast.error');
        expect(toast).not.toBeNull();
        expect(toast.textContent).toContain(`Maximum limit of ${MAX_CUSTOM_HOLIDAYS} custom holidays reached`);
    });

    test('rejects impossible custom holiday dates', () => {
        const dateInput = document.getElementById('custom-date-input');
        const nameInput = document.getElementById('custom-name-input');
        const addBtn = document.getElementById('add-custom-btn');
        const toastContainer = document.getElementById('toast-container');

        dateInput.type = 'text';
        dateInput.value = '2025-02-29';
        nameInput.value = 'Impossible Holiday';
        addBtn.click();

        const state = app.getCurrentState();
        const holidays = state.customHolidaysByLocation['england-wales'] || [];
        expect(holidays.find(h => h.name === 'Impossible Holiday')).toBeUndefined();

        const toast = toastContainer.querySelector('.toast.error');
        expect(toast).not.toBeNull();
        expect(toast.textContent).toContain('Invalid date format');
    });

    test('rejects booking dates beyond MAX_BOOKED_DATES limit', () => {
        const MAX_BOOKED_DATES = 1000;
        const toastContainer = document.getElementById('toast-container');

        // Simulate a scenario where there are already MAX_BOOKED_DATES unique booked dates
        const maliciousState = {
            currentAllowance: 25,
            currentYear: 2025,
            currentRegion: 'england-wales',
            // Need unique valid dates
            bookedDates: Array.from({ length: MAX_BOOKED_DATES }, (_, i) => {
                const year = 2020 + Math.floor(i / 365);
                const dayOfYear = i % 365;
                const d = new Date(year, 0, 1);
                d.setDate(d.getDate() + dayOfYear);
                return d.toISOString().split('T')[0];
            })
        };

        Storage.prototype.getItem.mockReturnValue(JSON.stringify(maliciousState));

        jest.isolateModules(() => {
            const isolatedApp = require('../public/app.js');

            // Set up DOM for isolated app
            document.body.innerHTML = `
                <div id="sticky-header"></div>
                <select id="year-select"></select>
                <select id="location-select"></select>
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

            const stateBefore = isolatedApp.getCurrentState();
            expect(stateBefore.bookedDates.length).toBe(MAX_BOOKED_DATES);

            // Attempt to book one more date
            isolatedApp.toggleDateBooking('2025-12-31');

            const stateAfter = isolatedApp.getCurrentState();
            expect(stateAfter.bookedDates.length).toBe(MAX_BOOKED_DATES);

            const toastContainer = document.getElementById('toast-container');
            const toast = toastContainer.querySelector('.toast.error');
            expect(toast).not.toBeNull();
            expect(toast.textContent).toContain(`Maximum limit of ${MAX_BOOKED_DATES} booked dates reached`);
        });
    });

    test('sanitizes bookedDates from localStorage to prevent DoS', () => {
        // Mock large and invalid data in localStorage
        const maliciousDates = Array.from({ length: 1500 }, () => '2025-01-01');
        maliciousDates.push('invalid-date', 12345, null, '<script>alert(1)</script>', '2025-02-29', '2025-13-01');

        const maliciousState = {
            currentAllowance: 25,
            currentYear: 2025,
            currentRegion: 'england-wales',
            bookedDates: maliciousDates
        };

        Storage.prototype.getItem.mockReturnValue(JSON.stringify(maliciousState));

        // Re-require the app to trigger init() with malicious localStorage
        jest.isolateModules(() => {
            const app = require('../public/app.js');
            const state = app.getCurrentState();

            // Should be truncated to MAX_BOOKED_DATES (1000)
            expect(state.bookedDates.length).toBeLessThanOrEqual(1000);

            // Should filter out invalid dates
            expect(state.bookedDates).not.toContain('invalid-date');
            expect(state.bookedDates).not.toContain(12345);
            expect(state.bookedDates).not.toContain(null);
            expect(state.bookedDates).not.toContain('<script>alert(1)</script>');
            expect(state.bookedDates).not.toContain('2025-02-29');
            expect(state.bookedDates).not.toContain('2025-13-01');

            // Ensure all dates strictly conform to the date regex
            const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
            const allValid = state.bookedDates.every(d => typeof d === 'string' && DATE_REGEX.test(d));
            expect(allValid).toBe(true);
        });
    });

    test('ignores out-of-bounds currentAllowance from localStorage to prevent memory DoS', () => {
        const maliciousState = {
            currentAllowance: 1000000,
            currentYear: 2025,
            currentRegion: 'england-wales',
            bookedDates: []
        };

        Storage.prototype.getItem.mockReturnValue(JSON.stringify(maliciousState));

        jest.isolateModules(() => {
            const app = require('../public/app.js');
            const state = app.getCurrentState();

            // Default allowance should be 25 because 1000000 is invalid
            expect(state.currentAllowance).toBe(25);
        });
    });

    test('ignores negative currentAllowance from localStorage to prevent memory DoS', () => {
        const maliciousState = {
            currentAllowance: -5,
            currentYear: 2025,
            currentRegion: 'england-wales',
            bookedDates: []
        };

        Storage.prototype.getItem.mockReturnValue(JSON.stringify(maliciousState));

        jest.isolateModules(() => {
            const app = require('../public/app.js');
            const state = app.getCurrentState();

            // Default allowance should be 25 because -5 is invalid
            expect(state.currentAllowance).toBe(25);
        });
    });

    test('ignores fractional currentAllowance from localStorage to protect integer DP indexing', () => {
        const maliciousState = {
            currentAllowance: 1.5,
            currentYear: 2025,
            currentRegion: 'england-wales',
            bookedDates: []
        };

        Storage.prototype.getItem.mockReturnValue(JSON.stringify(maliciousState));

        jest.isolateModules(() => {
            const app = require('../public/app.js');
            const state = app.getCurrentState();

            expect(state.currentAllowance).toBe(25);
        });
    });

    test('ignores fractional currentYear from localStorage', () => {
        const maliciousState = {
            currentAllowance: 25,
            currentYear: 2026.5,
            currentRegion: 'england-wales',
            bookedDates: []
        };

        Storage.prototype.getItem.mockReturnValue(JSON.stringify(maliciousState));

        jest.isolateModules(() => {
            const app = require('../public/app.js');
            const state = app.getCurrentState();

            expect(state.currentYear).toBe(new Date().getFullYear());
        });
    });
});
