const { setTestState } = require('../public/app.js');

describe('Security: Local Storage Sanitization', () => {
    let app;

    beforeEach(() => {
        jest.resetModules();
        // Setup minimalist DOM
        document.body.innerHTML = `
            <div id="calendar-year-title"></div>
            <select id="year-select"></select>
            <select id="location-select"></select>
            <select id="weekend-select"></select>
            <input id="allowance-input">
            <div id="days-used"></div>
            <div id="days-off"></div>
            <div id="recommendations"></div>
            <div id="calendar" data-render-key=""></div>
            <div id="yoy-main"></div>
            <div id="yoy-sub"></div>
            <div id="holiday-data-status"></div>
            <form id="custom-holiday-form"></form>
            <div id="custom-holidays-list"></div>
        `;
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
        app = require('../public/app.js');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should sanitize bookedDates from localStorage', () => {
        const maliciousState = {
            currentAllowance: 25,
            currentYear: 2025,
            currentRegion: 'england-wales',
            bookedDates: [12345, null, { bad: "object" }]
        };

        Storage.prototype.getItem = jest.fn(() => JSON.stringify(maliciousState));

        jest.resetModules();
        app = require('../public/app.js');

        const state = app.getCurrentState();
        expect(state.bookedDates).toEqual([]);
    });
});
