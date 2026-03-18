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

describe('CDN Cache Poisoning Prevention', () => {
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

    const createRequest = (url, method = 'GET') => new Request(url, { method });
    const createResponse = (body = 'content', status = 200, headers = {}) => {
        return new Response(body, {
            status,
            statusText: status === 200 ? 'OK' : 'Error',
            headers: new Headers(headers)
        });
    };

    test('should explicitly set Cache-Control: no-store for error responses (e.g. 404), even with static file extensions', async () => {
        const request = createRequest('https://example.com/missing.css');
        mockFetch.mockResolvedValue(createResponse('Not Found', 404));

        const response = await worker.fetch(request, env);

        expect(response.status).toBe(404);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
    });

    test('should explicitly set Cache-Control: no-store for error responses (e.g. 500), even with static file extensions', async () => {
        const request = createRequest('https://example.com/broken.js');
        mockFetch.mockResolvedValue(createResponse('Internal Server Error', 500));

        const response = await worker.fetch(request, env);

        expect(response.status).toBe(500);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
    });
});