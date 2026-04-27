const {
    applySharedPlanFromUrl,
    encodePlanString,
    getCurrentState,
    handleShareLink,
    setTestState,
    REGIONS
} = require('../public/app.js');

describe('applySharedPlanFromUrl', () => {

    // Helper to update URL using pushState
    const setUrl = (urlStr) => {
        const url = new URL(urlStr);
        // pushState takes (state, title, url).
        // jsdom supports pushState.
        window.history.pushState({}, 'Test', url.href);
    };

    beforeEach(() => {
        // Reset state before each test
        setTestState(2023, REGIONS.ENGLAND_WALES, [], [], 'sat-sun', 25);

        // Reset URL to clean state
        setUrl('http://localhost/');
    });

    test('returns false if plan param is missing', () => {
        setUrl('http://localhost/');

        expect(applySharedPlanFromUrl()).toBe(false);

        const state = getCurrentState();
        expect(state.currentYear).toBe(2023); // Default
    });

    test('returns true and applies valid plan', () => {
        const payload = {
            currentYear: 2025,
            currentRegion: REGIONS.SCOTLAND,
            currentAllowance: 30,
            currentWeekendPattern: 'fri-sat',
            bookedDates: ['2025-01-01', '2025-01-02'],
            customHolidays: [{ date: '2025-05-05', name: 'Cinco De Mayo' }]
        };
        const encoded = encodePlanString(payload);

        const url = new URL('http://localhost/');
        url.searchParams.set('plan', encoded);
        setUrl(url.toString());

        expect(applySharedPlanFromUrl()).toBe(true);

        const state = getCurrentState();
        expect(state.currentYear).toBe(2025);
        expect(state.currentRegion).toBe(REGIONS.SCOTLAND);
        expect(state.currentAllowance).toBe(30);
        expect(state.currentWeekendPattern).toBe('fri-sat');
        expect(state.bookedDates).toEqual(expect.arrayContaining(['2025-01-01', '2025-01-02']));
        expect(state.customHolidaysByLocation[REGIONS.SCOTLAND]).toEqual(
            expect.arrayContaining([expect.objectContaining({ date: '2025-05-05', name: 'Cinco De Mayo' })])
        );
    });

    test('returns false and keeps state if plan string is invalid', () => {
        const url = new URL('http://localhost/');
        url.searchParams.set('plan', 'invalid-base64-string');
        setUrl(url.toString());

        expect(applySharedPlanFromUrl()).toBe(false);

        const state = getCurrentState();
        expect(state.currentYear).toBe(2023); // Unchanged
    });

    test('falls back to default region if decoded region is invalid', () => {
        const payload = {
            currentYear: 2024,
            currentRegion: 'mars-colony',
            currentAllowance: 20
        };
        const encoded = encodePlanString(payload);

        const url = new URL('http://localhost/');
        url.searchParams.set('plan', encoded);
        setUrl(url.toString());

        expect(applySharedPlanFromUrl()).toBe(true);

        const state = getCurrentState();
        expect(state.currentRegion).toBe(REGIONS.ENGLAND_WALES); // Fallback
        expect(state.currentYear).toBe(2024); // Other fields applied
    });

    test('falls back to default weekend pattern if decoded pattern is invalid', () => {
        const payload = {
            currentRegion: REGIONS.QATAR, // Default is fri-sat
            currentWeekendPattern: 'invalid-pattern'
        };
        const encoded = encodePlanString(payload);

        const url = new URL('http://localhost/');
        url.searchParams.set('plan', encoded);
        setUrl(url.toString());

        expect(applySharedPlanFromUrl()).toBe(true);

        const state = getCurrentState();
        expect(state.currentRegion).toBe(REGIONS.QATAR);
        expect(state.currentWeekendPattern).toBe('fri-sat'); // Default for Qatar
    });

    test('handles custom holidays correctly when mixing regions', () => {
        // Initial state set in beforeEach (England)

        const payload = {
            currentRegion: REGIONS.SCOTLAND,
            customHolidays: [{ date: '2023-08-01', name: 'Scotland Hol' }]
        };
        const encoded = encodePlanString(payload);

        const url = new URL('http://localhost/');
        url.searchParams.set('plan', encoded);
        setUrl(url.toString());

        expect(applySharedPlanFromUrl()).toBe(true);

        const state = getCurrentState();
        expect(state.currentRegion).toBe(REGIONS.SCOTLAND);
        // Should have populated custom holidays for Scotland
        expect(state.customHolidaysByLocation[REGIONS.SCOTLAND]).toHaveLength(1);
        expect(state.customHolidaysByLocation[REGIONS.SCOTLAND][0].name).toBe('Scotland Hol');
    });

    test('applies shared plans for new North America regions', () => {
        const payload = {
            currentRegion: REGIONS.US_CA,
            currentWeekendPattern: 'sat-sun',
            customHolidays: [{ date: '2026-03-31', name: 'Cesar Chavez Day' }]
        };
        const encoded = encodePlanString(payload);

        const url = new URL('http://localhost/');
        url.searchParams.set('plan', encoded);
        setUrl(url.toString());

        expect(applySharedPlanFromUrl()).toBe(true);

        const state = getCurrentState();
        expect(state.currentRegion).toBe(REGIONS.US_CA);
        expect(state.currentWeekendPattern).toBe('sat-sun');
        expect(state.customHolidaysByLocation[REGIONS.US_CA]).toEqual(
            expect.arrayContaining([expect.objectContaining({ name: 'Cesar Chavez Day' })])
        );
    });

    test('keeps share button emoji hidden from assistive names after copied state resets', async () => {
        jest.useFakeTimers();
        document.body.innerHTML = `
            <button id="share-btn" aria-label="Copy Share Link"><span aria-hidden="true">🔗</span> Copy Share Link</button>
            <div id="toast-container"></div>
        `;
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: jest.fn().mockResolvedValue() },
            configurable: true
        });

        await handleShareLink();

        const shareBtn = document.getElementById('share-btn');
        expect(shareBtn.textContent).toBe('✅ Copied!');
        expect(shareBtn.querySelector('span').getAttribute('aria-hidden')).toBe('true');
        expect(shareBtn.getAttribute('aria-label')).toBe('Copied!');

        jest.advanceTimersByTime(2000);

        expect(shareBtn.textContent).toBe('🔗 Copy Share Link');
        expect(shareBtn.querySelector('span').getAttribute('aria-hidden')).toBe('true');
        expect(shareBtn.getAttribute('aria-label')).toBe('Copy Share Link');

        jest.useRealTimers();
    });
});
