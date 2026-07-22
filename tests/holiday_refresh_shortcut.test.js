/** @jest-environment jsdom */

require('../public/app.js');

describe('holiday dataset refresh shortcut', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        jest.useFakeTimers();
        document.body.innerHTML = '<div id="toast-container"></div>';
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                updatedAt: '2026-07-19',
                locations: {}
            })
        });
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
        document.body.innerHTML = '';
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    test('Ctrl+D forces a fresh GET and confirms completion', async () => {
        const event = new KeyboardEvent('keydown', {
            key: 'd',
            ctrlKey: true,
            cancelable: true
        });

        document.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(true);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith('/data/holidays.json', {
            method: 'GET',
            cache: 'no-store'
        });

        expect(document.querySelector('.toast.info').textContent)
            .toContain('Refreshing holiday data…');

        await jest.advanceTimersByTimeAsync(0);

        expect(document.querySelector('.toast.success').textContent)
            .toContain('Holiday data refreshed. Updated 2026-07-19.');
    });

    test('reports a failed holiday request', async () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch.mockResolvedValue({
            ok: false,
            status: 503
        });

        document.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'd',
            ctrlKey: true,
            cancelable: true
        }));

        await jest.advanceTimersByTimeAsync(0);

        expect(document.querySelector('.toast.error').textContent)
            .toContain('Holiday data refresh failed. Please try again.');
        expect(consoleError).toHaveBeenCalledWith(
            'Failed to manually refresh holiday data from "/data/holidays.json":',
            expect.objectContaining({
                message: 'GET "/data/holidays.json" failed with HTTP 503'
            })
        );

        consoleError.mockRestore();
    });

    test.each([
        ['D without Ctrl', { key: 'd' }],
        ['Ctrl+Alt+D', { key: 'd', ctrlKey: true, altKey: true }],
        ['Ctrl+Meta+D', { key: 'd', ctrlKey: true, metaKey: true }],
        ['Ctrl+Shift+D', { key: 'd', ctrlKey: true, shiftKey: true }],
        ['a repeated Ctrl+D', { key: 'd', ctrlKey: true, repeat: true }]
    ])('ignores %s', (_name, options) => {
        const event = new KeyboardEvent('keydown', {
            ...options,
            cancelable: true
        });

        document.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(false);
        expect(global.fetch).not.toHaveBeenCalled();
        expect(document.querySelector('.toast')).toBeNull();
    });
});
