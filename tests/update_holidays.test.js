
const { buildHolidayDataset } = require('../scripts/update_holidays.js');

describe('update_holidays.js', () => {
    let originalConsoleError;
    let originalFetch;
    let consoleErrorMock;

    beforeEach(() => {
        // Mock console.error
        consoleErrorMock = jest.fn();
        originalConsoleError = console.error;
        console.error = consoleErrorMock;

        // Mock fetch
        originalFetch = global.fetch;
        global.fetch = jest.fn();

        // Mock process.env
        process.env.CALENDARIFIC_API_KEY = 'secret-api-key-123';
        process.env.CALENDARIFIC_KEY = 'secret-api-key-123';
    });

    afterEach(() => {
        console.error = originalConsoleError;
        global.fetch = originalFetch;
        delete process.env.CALENDARIFIC_API_KEY;
        delete process.env.CALENDARIFIC_KEY;
    });

    test('buildHolidayDataset should redact API key from error logs when fetch fails', async () => {
        // Setup fetch to fail with an error message containing the API key
        // Simulating a case where the error message leaks the URL
        const apiKey = 'secret-api-key-123';
        const leakedUrl = `https://calendarific.com/api/v2/holidays?api_key=${apiKey}&country=QA&year=2024`;

        global.fetch.mockImplementation(() => {
            return Promise.reject(new Error(`Request to ${leakedUrl} failed`));
        });

        // We only care about the logging side effect
        await buildHolidayDataset();

        // Verify console.error was called
        expect(consoleErrorMock).toHaveBeenCalled();

        // Check all calls to console.error
        const errorCalls = consoleErrorMock.mock.calls.map(args => args.join(' '));
        const combinedErrors = errorCalls.join('\n');

        // It should contain REDACTED
        expect(combinedErrors).toContain('REDACTED');

        // It should NOT contain the secret key
        expect(combinedErrors).not.toContain(apiKey);
    });

    test('buildHolidayDataset should redact API key even if error object string conversion leaks it', async () => {
        const apiKey = 'secret-api-key-123';

        // Error object without message property, forcing String(e) usage
        const errorWithSecret = {
            toString: () => `Error: Failed to fetch ${apiKey}`
        };

        global.fetch.mockImplementation(() => {
            return Promise.reject(errorWithSecret);
        });

        await buildHolidayDataset();

        const errorCalls = consoleErrorMock.mock.calls.map(args => args.join(' '));
        const combinedErrors = errorCalls.join('\n');

        expect(combinedErrors).toContain('REDACTED');
        expect(combinedErrors).not.toContain(apiKey);
    });
});
