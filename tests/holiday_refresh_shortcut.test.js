/** @jest-environment jsdom */

jest.useFakeTimers();
require('../public/app.js');

describe('holiday dataset refresh shortcut', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        jest.useFakeTimers();
        document.body.innerHTML = '<div id="toast-container"></div>';
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 202,
            json: jest.fn().mockResolvedValue({ status: 'accepted' })
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

    test('Ctrl+D starts the full cron refresh and confirms acceptance', async () => {
        const event = new KeyboardEvent('keydown', {
            key: 'd',
            ctrlKey: true,
            cancelable: true
        });

        document.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(true);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith('/api/refresh-holidays', {
            method: 'POST',
            headers: {
                'X-Holiday-Refresh': 'full-cron'
            }
        });

        expect(document.querySelector('.toast.info').textContent)
            .toContain('Starting full holiday refresh…');

        await jest.advanceTimersByTimeAsync(0);

        expect(document.querySelector('.toast.success').textContent)
            .toContain('Full holiday refresh triggered. The cron job is running.');
    });

    test('reports a failed cron trigger request', async () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch.mockResolvedValue({
            ok: false,
            status: 503,
            json: jest.fn().mockResolvedValue({ error: 'Holiday refresh service unavailable.' })
        });

        document.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'd',
            ctrlKey: true,
            cancelable: true
        }));

        await jest.advanceTimersByTimeAsync(0);

        expect(document.querySelector('.toast.error').textContent)
            .toContain('Full holiday refresh could not be started. Please try again.');
        expect(consoleError).toHaveBeenCalledWith(
            'Failed to trigger full holiday refresh via "/api/refresh-holidays":',
            expect.objectContaining({
                message: 'Holiday refresh service unavailable.',
                status: 503
            })
        );

        consoleError.mockRestore();
    });

    test('reports a recent or running cron trigger without retrying', async () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch.mockResolvedValue({
            ok: false,
            status: 429,
            json: jest.fn().mockResolvedValue({
                error: 'Holiday refresh already running or recently triggered.'
            })
        });

        document.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'd',
            ctrlKey: true,
            cancelable: true
        }));

        await jest.advanceTimersByTimeAsync(0);

        const messages = Array.from(document.querySelectorAll('.toast.info'))
            .map(toast => toast.textContent);
        expect(messages).toContain(
            'ℹ️ Information: Holiday refresh is already running or was triggered recently.'
        );
        expect(global.fetch).toHaveBeenCalledTimes(1);

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
