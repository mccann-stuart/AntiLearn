/**
 * @jest-environment jsdom
 */

describe('Reset Button UX Interaction', () => {
    let app;

    beforeEach(() => {
        jest.resetModules();
        jest.useFakeTimers();

        // Setup DOM elements expected by app.js
        document.body.innerHTML = `
            <button id="reset-btn">Reset Plan</button>
            <div id="toast-container"></div>
            <div id="calendar"></div>
            <div id="days-used"></div>
            <div id="days-off"></div>
            <div id="recommendations"></div>
            <div id="calendar-year-title"></div>
            <div id="holiday-data-status"></div>
            <div id="yoy-main"></div>
            <div id="yoy-sub"></div>
            <select id="year-select"></select>
            <select id="location-select"></select>
            <select id="weekend-select"></select>
            <input id="allowance-input" type="number">
        `;

        // Mock localStorage to return nothing
        const localStorageMock = (function() {
            let store = {};
            return {
                getItem: jest.fn(key => store[key] || null),
                setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
                removeItem: jest.fn(key => { delete store[key]; }),
                clear: jest.fn(() => { store = {}; })
            };
        })();
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });

        // Require app to init
        // This will attach event listeners
        app = require('../public/app.js');

        // Clear any initial timers from init() -> resetToOptimal()
        jest.runAllTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('First click changes text and adds confirmation class', () => {
        const btn = document.getElementById('reset-btn');
        btn.click();

        expect(btn.textContent).toBe('Are you sure?');
        expect(btn.classList.contains('btn-danger')).toBe(true);
        expect(btn.dataset.confirm).toBe('true');
    });

    test('Timeout reverts button state', () => {
        const btn = document.getElementById('reset-btn');
        btn.click();

        // Fast-forward 3 seconds
        jest.advanceTimersByTime(3000);

        expect(btn.textContent).toBe('Reset Plan');
        expect(btn.classList.contains('btn-danger')).toBe(false);
        expect(btn.dataset.confirm).toBeUndefined();
    });

    test('Second click within timeout triggers reset and resets button state', () => {
        const btn = document.getElementById('reset-btn');

        // First click
        btn.click();
        expect(btn.dataset.confirm).toBe('true');

        // Second click
        btn.click();

        // Verify button state resets immediately
        expect(btn.textContent).toBe('Reset Plan');
        expect(btn.classList.contains('btn-danger')).toBe(false);
        expect(btn.dataset.confirm).toBeUndefined();
    });
});
