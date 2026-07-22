/** @jest-environment jsdom */

require('../public/app.js');

describe('holiday dataset refresh shortcut', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({ locations: {} })
        });
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    test('Ctrl+D forces a fresh GET of the holiday dataset', () => {
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
    });
});
