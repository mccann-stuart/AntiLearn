
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

describe('Cloudflare Worker Method Restriction', () => {
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
            },
            HOLIDAY_DATA: {
                get: jest.fn().mockResolvedValue(JSON.stringify({ updatedAt: '2026-02-17' }))
            }
        };
    });

    const createRequest = (url, method = 'GET', headers = {}) => new Request(url, { method, headers });
    const createResponse = (body = 'content', headers = {}) => {
        return new Response(body, {
            status: 200,
            statusText: 'OK',
            headers: new Headers(headers)
        });
    };

    test('should allow GET requests', async () => {
        const request = createRequest('https://example.com/data/holidays.json', 'GET');
        mockFetch.mockResolvedValue(createResponse());

        const response = await worker.fetch(request, env);
        expect(response.status).toBe(200);
    });

    test('should allow HEAD requests', async () => {
        const request = createRequest('https://example.com/data/holidays.json', 'HEAD');
        mockFetch.mockResolvedValue(createResponse());

        const response = await worker.fetch(request, env);
        // Currently worker.mjs doesn't specifically handle HEAD differently, so it returns 200.
        expect(response.status).toBe(200);
    });

    test('should reject POST requests with 405', async () => {
        const request = createRequest('https://example.com/data/holidays.json', 'POST');
        mockFetch.mockResolvedValue(createResponse());

        const response = await worker.fetch(request, env);
        expect(response.status).toBe(405);
        expect(response.headers.get('Allow')).toBe('GET, HEAD');
        expect(await response.text()).toBe('Method Not Allowed');
    });

    test('should reject PUT requests with 405', async () => {
        const request = createRequest('https://example.com/data/holidays.json', 'PUT');
        mockFetch.mockResolvedValue(createResponse());

        const response = await worker.fetch(request, env);
        expect(response.status).toBe(405);
    });

    test('should set Cache-Control: no-store on 405 responses', async () => {
        // We use a CSS file here because in the old code, applySecurityHeaders would
        // apply the static CSS Cache-Control headers to a 405 response.
        const request = createRequest('https://example.com/style.css', 'POST');
        mockFetch.mockResolvedValue(createResponse());

        const response = await worker.fetch(request, env);
        expect(response.status).toBe(405);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
    });

    test('should allow only POST for the manual cron trigger route', async () => {
        const request = createRequest('https://example.com/api/refresh-holidays', 'GET');

        const response = await worker.fetch(request, env, {});

        expect(response.status).toBe(405);
        expect(response.headers.get('Allow')).toBe('POST');
    });

    test('should reject a manual cron trigger without same-origin browser headers', async () => {
        const request = createRequest(
            'https://example.com/api/refresh-holidays',
            'POST',
            { 'X-Holiday-Refresh': 'full-cron' }
        );
        const ctx = { waitUntil: jest.fn() };

        const response = await worker.fetch(request, env, ctx);

        expect(response.status).toBe(403);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(ctx.waitUntil).not.toHaveBeenCalled();
    });

    test('should rate-limit a repeated manual cron trigger', async () => {
        env.HOLIDAY_DATA.get.mockResolvedValue(JSON.stringify({
            triggeredAt: '2026-07-22T18:00:00.000Z'
        }));
        const request = createRequest(
            'https://example.com/api/refresh-holidays',
            'POST',
            {
                'Origin': 'https://example.com',
                'Sec-Fetch-Site': 'same-origin',
                'X-Holiday-Refresh': 'full-cron'
            }
        );
        const ctx = { waitUntil: jest.fn() };

        const response = await worker.fetch(request, env, ctx);

        expect(response.status).toBe(429);
        expect(response.headers.get('Retry-After')).toBe('600');
        expect(ctx.waitUntil).not.toHaveBeenCalled();
    });
});
