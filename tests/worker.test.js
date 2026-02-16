
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

    test('should handle errors gracefully', async () => {
        const request = createRequest('https://example.com/');
        mockFetch.mockRejectedValue(new Error('Asset fetch failed'));

        // Mock console.error to avoid noise in test output
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

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
});
