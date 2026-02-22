
// Minimal polyfill for Cloudflare Worker environment in JSDOM/Jest
if (typeof Request === 'undefined') {
    global.Request = class Request {
        constructor(url, init = {}) {
            this.url = url;
            this.method = init.method || 'GET';
            this.headers = new Headers(init.headers);
        }
    };
}

if (typeof Headers === 'undefined') {
    global.Headers = class Headers {
        constructor(init) {
            this.map = new Map();
            if (init) {
                if (init instanceof Headers) {
                    init.forEach((v, k) => this.map.set(k.toLowerCase(), v));
                } else if (typeof init === 'object') {
                    Object.entries(init).forEach(([k, v]) => this.map.set(k.toLowerCase(), String(v)));
                }
            }
        }
        append(key, value) { this.map.set(key.toLowerCase(), String(value)); }
        set(key, value) { this.map.set(key.toLowerCase(), String(value)); }
        get(key) { return this.map.get(key.toLowerCase()) || null; }
        has(key) { return this.map.has(key.toLowerCase()); }
        forEach(callback) { this.map.forEach((v, k) => callback(v, k, this)); }
    };
}

if (typeof Response === 'undefined') {
    global.Response = class Response {
        constructor(body, init = {}) {
            this.body = body;
            this.status = init.status || 200;
            this.statusText = init.statusText || 'OK';
            this.headers = new Headers(init.headers);
        }
        text() {
            return Promise.resolve(String(this.body));
        }
    };
}

describe('Cloudflare Worker Logic', () => {
    let worker;
    let env;
    let mockFetch;

    beforeAll(async () => {
        const workerModule = await import('../worker.mjs');
        worker = workerModule.default;
    });

    beforeEach(() => {
        mockFetch = jest.fn();
        env = {
            ASSETS: {
                fetch: mockFetch
            }
        };
    });

    // Helper to create a mock request
    const createRequest = (url) => new Request(url);

    // Helper to create a mock response from ASSETS
    const createResponse = (body = 'content', headers = {}) => {
        return new Response(body, {
            status: 200,
            statusText: 'OK',
            headers: new Headers(headers)
        });
    };

    test('should return response with security headers', async () => {
        const request = createRequest('https://example.com/');
        mockFetch.mockResolvedValue(createResponse());

        const response = await worker.fetch(request, env);

        expect(mockFetch).toHaveBeenCalledWith(request);
        expect(response.status).toBe(200);

        // Security Headers
        expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
        expect(response.headers.get('X-Frame-Options')).toBe('DENY');
        expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
        expect(response.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains; preload');
        expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
        expect(response.headers.get('Permissions-Policy')).toBe('geolocation=(), microphone=(), camera=()');
        expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
        expect(response.headers.get('Content-Security-Policy')).toContain("object-src 'none'");
        expect(response.headers.get('Content-Security-Policy')).toContain("base-uri 'none'");
        expect(response.headers.get('Content-Security-Policy')).toContain("form-action 'self'");
        expect(response.headers.get('Content-Security-Policy')).toContain("frame-ancestors 'none'");
        expect(response.headers.get('Content-Security-Policy')).toContain("upgrade-insecure-requests");
        expect(response.headers.get('Content-Security-Policy')).not.toContain("'unsafe-inline'");
    });

    test('should set Cache-Control for app.js (no-cache)', async () => {
        const request = createRequest('https://example.com/app.js');
        mockFetch.mockResolvedValue(createResponse());

        const response = await worker.fetch(request, env);

        expect(response.headers.get('Cache-Control')).toBe('public, max-age=0, must-revalidate');
    });

    test('should set Cache-Control for CSS files (long cache)', async () => {
        const request = createRequest('https://example.com/style.css');
        mockFetch.mockResolvedValue(createResponse());

        const response = await worker.fetch(request, env);

        expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
    });

    test('should set Cache-Control for JS files other than app.js (long cache)', async () => {
        const request = createRequest('https://example.com/vendor.js');
        mockFetch.mockResolvedValue(createResponse());

        const response = await worker.fetch(request, env);

        expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
    });

    test('should set Cache-Control for HTML files (short cache)', async () => {
        const request = createRequest('https://example.com/index.html');
        mockFetch.mockResolvedValue(createResponse());

        const response = await worker.fetch(request, env);

        expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600, must-revalidate');
    });

    test('should set Cache-Control for root path (short cache)', async () => {
        const request = createRequest('https://example.com/');
        mockFetch.mockResolvedValue(createResponse());

        const response = await worker.fetch(request, env);

        expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600, must-revalidate');
    });

    test('should set Cache-Control for images (medium cache)', async () => {
        const extensions = ['png', 'jpg', 'jpeg', 'svg', 'webp', 'ico'];

        for (const ext of extensions) {
            const request = createRequest(`https://example.com/image.${ext}`);
            mockFetch.mockResolvedValue(createResponse());
            const response = await worker.fetch(request, env);
            expect(response.headers.get('Cache-Control')).toBe('public, max-age=86400');
        }
    });

    test('should serve holiday data from KV when available', async () => {
        const request = createRequest('https://example.com/data/holidays.json');
        env.HOLIDAY_DATA = {
            get: jest.fn().mockResolvedValue(JSON.stringify({ updatedAt: '2026-02-17' }))
        };
        mockFetch.mockResolvedValue(createResponse());

        const response = await worker.fetch(request, env);

        expect(env.HOLIDAY_DATA.get).toHaveBeenCalledWith('holidays');
        expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
        expect(await response.text()).toContain('2026-02-17');
    });

    test('should handle errors gracefully', async () => {
        const request = createRequest('https://example.com/');
        mockFetch.mockRejectedValue(new Error('Asset fetch failed'));

        // Mock console.error to avoid noise in test output
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        const response = await worker.fetch(request, env);

        expect(response.status).toBe(500);
        expect(await response.text()).toBe('Internal Server Error');
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
    });

    test('should preserve original headers from asset response', async () => {
        const request = createRequest('https://example.com/');
        mockFetch.mockResolvedValue(createResponse('content', { 'Content-Type': 'text/html', 'Custom-Header': 'value' }));

        const response = await worker.fetch(request, env);

        expect(response.headers.get('Content-Type')).toBe('text/html');
        expect(response.headers.get('Custom-Header')).toBe('value');
        // And check if our security headers are still added
        expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    });

    test('should redact API key in logs when Calendarific fetch fails', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch = jest.fn().mockRejectedValue(new Error('Network error with https://api.calendarific.com/?api_key=secret-key-123'));

        const envWithSecrets = {
            ...env,
            CALENDARIFIC_API_KEY: 'secret-key-123',
            HOLIDAY_DATA: {
                put: jest.fn()
            }
        };

        let capturedPromise;
        const ctx = {
            waitUntil: (promise) => { capturedPromise = promise; }
        };

        await worker.scheduled({}, envWithSecrets, ctx);
        await capturedPromise;

        expect(consoleSpy).toHaveBeenCalled();
        const errorCalls = consoleSpy.mock.calls.map(args => args.join(' '));
        const combinedErrors = errorCalls.join('\n');

        expect(combinedErrors).not.toContain('secret-key-123');
        expect(combinedErrors).toContain('REDACTED');

        consoleSpy.mockRestore();
        delete global.fetch;
    });

    test('should redact all occurrences of API key in logs', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        // Simulate error message with repeated API key
        global.fetch = jest.fn().mockRejectedValue(new Error('Failed to fetch from https://api.calendarific.com/?api_key=secret-key-123 because secret-key-123 is invalid'));

        const envWithSecrets = {
            ...env,
            CALENDARIFIC_API_KEY: 'secret-key-123',
            HOLIDAY_DATA: {
                put: jest.fn()
            }
        };

        let capturedPromise;
        const ctx = {
            waitUntil: (promise) => { capturedPromise = promise; }
        };

        await worker.scheduled({}, envWithSecrets, ctx);
        await capturedPromise;

        expect(consoleSpy).toHaveBeenCalled();
        const errorCalls = consoleSpy.mock.calls.map(args => args.join(' '));
        const combinedErrors = errorCalls.join('\n');

        expect(combinedErrors).not.toContain('secret-key-123');
        expect(combinedErrors).toContain('REDACTED');

        consoleSpy.mockRestore();
        delete global.fetch;
    });

    test('should timeout and redact URL after 10 seconds', async () => {
        jest.useFakeTimers();
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        let callCount = 0;
        // Mock fetch to handle AbortSignal
        global.fetch = jest.fn().mockImplementation((url, options) => {
            callCount++;
            // Only hang the first request (Calendarific) to test timeout logic
            if (callCount === 1) {
                return new Promise((resolve, reject) => {
                    if (options && options.signal) {
                        const onAbort = () => {
                            const error = new Error('The operation was aborted');
                            error.name = 'AbortError';
                            reject(error);
                        };
                        if (options.signal.aborted) {
                            onAbort();
                        } else {
                            options.signal.addEventListener('abort', onAbort);
                        }
                    }
                });
            } else {
                // Resolve others immediately to avoid test timeout
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ response: { holidays: [] } })
                });
            }
        });

        const envWithSecrets = {
            ...env,
            CALENDARIFIC_API_KEY: 'secret-key-123',
            HOLIDAY_DATA: {
                put: jest.fn()
            }
        };

        let capturedPromise;
        const ctx = {
            waitUntil: (promise) => { capturedPromise = promise; }
        };

        await worker.scheduled({}, envWithSecrets, ctx);

        // Fast-forward time
        jest.advanceTimersByTime(11000);

        jest.useRealTimers();
        await capturedPromise;

        expect(consoleSpy).toHaveBeenCalled();
        const errorCalls = consoleSpy.mock.calls.map(args => args.join(' '));
        const combinedErrors = errorCalls.join('\n');

        expect(combinedErrors).toContain('Request timed out for');
        expect(combinedErrors).not.toContain('secret-key-123');
        expect(combinedErrors).toContain('REDACTED');

        consoleSpy.mockRestore();
        delete global.fetch;
    }, 15000);
});
