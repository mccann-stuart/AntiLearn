import { buildHolidayDataset as buildSharedHolidayDataset } from './lib/holiday_dataset_builder.mjs';

const IMAGE_EXTENSIONS_REGEX = /\.(ico|png|jpg|jpeg|svg|webp)$/;
const JSON_EXTENSIONS_REGEX = /\.json$/;
const HOLIDAY_DATA_KEY = 'holidays';
const CALENDARIFIC_ENV_KEYS = [
    'calendarific',
    'CALENDARIFIC_API_KEY',
    'CALENDARIFIC_KEY',
    'CALENDARIFIC'
];

function getCacheControl(pathname) {
    if (pathname.endsWith('app.js')) {
        return 'public, max-age=0, must-revalidate';
    }
    if (pathname.endsWith('.css') || pathname.endsWith('.js')) {
        return 'public, max-age=31536000, immutable';
    }
    if (pathname.endsWith('.html') || pathname === '/') {
        return 'public, max-age=3600, must-revalidate';
    }
    if (pathname.match(IMAGE_EXTENSIONS_REGEX)) {
        return 'public, max-age=86400';
    }
    if (pathname.match(JSON_EXTENSIONS_REGEX)) {
        return 'public, max-age=3600, must-revalidate';
    }
    return null;
}

function applySecurityHeaders(response, pathname) {
    const newHeaders = new Headers(response.headers);

    // Security Headers
    newHeaders.set('X-Content-Type-Options', 'nosniff');
    newHeaders.set('X-Frame-Options', 'DENY');
    newHeaders.set('X-XSS-Protection', '1; mode=block');
    newHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    newHeaders.set('Permissions-Policy', 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), display-capture=()');

    // Content Security Policy
    newHeaders.set('Content-Security-Policy',
        "default-src 'self'; " +
        "style-src 'self' https://fonts.googleapis.com; " +
        "font-src https://fonts.gstatic.com; " +
        "img-src 'self' data:; " +
        "script-src 'self'; " +
        "connect-src 'self'; " +
        "object-src 'none'; " +
        "base-uri 'none'; " +
        "form-action 'self'; " +
        "frame-ancestors 'none'; " +
        "upgrade-insecure-requests;"
    );

    if (response.status >= 400) {
        newHeaders.set('Cache-Control', 'no-store');
    } else {
        const cacheControl = getCacheControl(pathname);
        if (cacheControl && !newHeaders.has('Cache-Control')) {
            newHeaders.set('Cache-Control', cacheControl);
        }
    }

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
    });
}

async function handleHolidayDataRequest(env) {
    if (!env.HOLIDAY_DATA) {
        return new Response(JSON.stringify({ error: 'Holiday data store not configured.' }), {
            status: 503,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Cache-Control': 'no-store'
            }
        });
    }
    const data = await env.HOLIDAY_DATA.get(HOLIDAY_DATA_KEY);
    if (!data) {
        return new Response(JSON.stringify({ error: 'Holiday data unavailable.' }), {
            status: 503,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Cache-Control': 'no-store'
            }
        });
    }
    return new Response(data, {
        status: 200,
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        }
    });
}

async function handleRequest(request, env) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response('Method Not Allowed', {
            status: 405,
            headers: {
                'Allow': 'GET, HEAD',
                'Content-Type': 'text/plain',
                'Cache-Control': 'no-store'
            }
        });
    }

    const url = new URL(request.url);
    if (url.pathname === '/data/holidays.json') {
        return handleHolidayDataRequest(env);
    }
    return env.ASSETS.fetch(request);
}

async function fetchJson(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        if (error.name === 'AbortError') {
            try {
                const parsedUrl = new URL(url);
                throw new Error(`Request timed out for ${parsedUrl.hostname}${parsedUrl.pathname}`);
            } catch (e) {
                throw new Error('Request timed out');
            }
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function resolveSecretBinding(binding, secretName) {
    if (!binding) return '';
    if (typeof binding === 'string') return binding;
    if (typeof binding.get === 'function') {
        try {
            const value = await binding.get();
            if (typeof value === 'string') return value;
        } catch (e) {
            console.warn(`Failed to access secret via direct get(): ${e.message || String(e)}`);
        }
        try {
            const value = await binding.get(secretName);
            if (typeof value === 'string') return value;
        } catch (e) {
            console.warn(`Failed to access secret via get(name) for ${secretName}: ${e.message || String(e)}`);
            return '';
        }
    }
    return '';
}

async function getCalendarificApiKey(env) {
    if (!env) return '';
    for (const key of CALENDARIFIC_ENV_KEYS) {
        const binding = env[key];
        const value = await resolveSecretBinding(binding, key);
        if (value) return value;
    }
    return '';
}

async function buildHolidayDataset(env) {
    return buildSharedHolidayDataset({
        fetchJson,
        apiKey: await getCalendarificApiKey(env),
        logger: console
    });
}

async function refreshHolidayDataset(env) {
    if (!env.HOLIDAY_DATA) return;
    const dataset = await buildHolidayDataset(env);
    console.log('Holiday dataset built successfully. Saving to KV...');
    await env.HOLIDAY_DATA.put(HOLIDAY_DATA_KEY, JSON.stringify(dataset));
    console.log('Holiday dataset saved to KV.');
}

export default {
    async fetch(request, env) {
        try {
            const response = await handleRequest(request, env);
            const pathname = new URL(request.url).pathname;
            return applySecurityHeaders(response, pathname);
        } catch (error) {
            console.error(`Worker error: ${error.message || String(error)}`);
            const errorResponse = new Response('Internal Server Error', {
                status: 500,
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Cache-Control': 'no-store'
                }
            });
            try {
                const pathname = new URL(request.url).pathname;
                return applySecurityHeaders(errorResponse, pathname);
            } catch (e) {
                return applySecurityHeaders(errorResponse, '/');
            }
        }
    },
    async scheduled(event, env, ctx) {
        console.log('Cron trigger started: Refreshing holiday dataset...');
        ctx.waitUntil(refreshHolidayDataset(env).then(() => {
            console.log('Cron trigger finished successfully.');
        }).catch(err => {
            console.error(`Cron trigger failed: ${err.message || String(err)}`);
        }));
    }
};
