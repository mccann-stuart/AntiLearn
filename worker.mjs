import {
    assertCalendarificPublicationSafe,
    buildHolidayDataset as buildSharedHolidayDataset,
    redactUrl
} from './lib/holiday_dataset_builder.mjs';

const IMAGE_EXTENSIONS_REGEX = /\.(ico|png|jpg|jpeg|svg|webp)$/;
const JSON_EXTENSIONS_REGEX = /\.json$/;
const HOLIDAY_DATA_KEY = 'holidays';
const MANUAL_REFRESH_PATH = '/api/refresh-holidays';
const MANUAL_REFRESH_HEADER = 'X-Holiday-Refresh';
const MANUAL_REFRESH_HEADER_VALUE = 'full-cron';
const MANUAL_REFRESH_LOCK_KEY = 'holiday-refresh-manual-lock';
const MANUAL_REFRESH_COOLDOWN_SECONDS = 600;
const MAX_FETCH_ATTEMPTS = 3;
const MAX_RETRY_DELAY_MS = 60000;
const RETRY_BASE_DELAY_MS = 1000;
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

function jsonResponse(payload, status, headers = {}) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            ...headers
        }
    });
}

function isAllowedManualRefreshRequest(request, url) {
    // The marker forces a CORS preflight for cross-site scripts. This is a CSRF
    // and accidental-use guard for the hidden shortcut, not user authentication.
    const origin = request.headers.get('Origin');
    const fetchSite = request.headers.get('Sec-Fetch-Site');
    const refreshHeader = request.headers.get(MANUAL_REFRESH_HEADER);

    return origin === url.origin &&
        (!fetchSite || fetchSite === 'same-origin') &&
        refreshHeader === MANUAL_REFRESH_HEADER_VALUE;
}

async function handleManualHolidayRefreshRequest(request, url, env, ctx) {
    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', {
            status: 405,
            headers: {
                'Allow': 'POST',
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-store'
            }
        });
    }

    if (!isAllowedManualRefreshRequest(request, url)) {
        return jsonResponse({ error: 'Manual holiday refresh request rejected.' }, 403);
    }

    if (!env.HOLIDAY_DATA || !ctx || typeof ctx.waitUntil !== 'function') {
        return jsonResponse({ error: 'Holiday refresh service unavailable.' }, 503);
    }

    const activeRefresh = await env.HOLIDAY_DATA.get(MANUAL_REFRESH_LOCK_KEY);
    if (activeRefresh) {
        return jsonResponse(
            { error: 'Holiday refresh already running or recently triggered.' },
            429,
            { 'Retry-After': String(MANUAL_REFRESH_COOLDOWN_SECONDS) }
        );
    }

    const triggeredAt = new Date().toISOString();
    await env.HOLIDAY_DATA.put(
        MANUAL_REFRESH_LOCK_KEY,
        JSON.stringify({ triggeredAt }),
        { expirationTtl: MANUAL_REFRESH_COOLDOWN_SECONDS }
    );
    ctx.waitUntil(runHolidayRefresh(env, 'Manual cron trigger'));

    return jsonResponse({ status: 'accepted', triggeredAt }, 202);
}

async function handleRequest(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === MANUAL_REFRESH_PATH) {
        return handleManualHolidayRefreshRequest(request, url, env, ctx);
    }

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

    if (url.pathname === '/data/holidays.json') {
        return handleHolidayDataRequest(env);
    }
    return env.ASSETS.fetch(request);
}

function getRetryDelayMs(response, attempt) {
    const retryAfter = response.headers && typeof response.headers.get === 'function'
        ? response.headers.get('Retry-After')
        : null;

    if (retryAfter) {
        const seconds = Number(retryAfter);
        const retryAt = Date.parse(retryAfter);
        const requestedDelay = Number.isFinite(seconds)
            ? seconds * 1000
            : retryAt - Date.now();
        if (Number.isFinite(requestedDelay) && requestedDelay >= 0) {
            return Math.min(requestedDelay, MAX_RETRY_DELAY_MS);
        }
    }

    return Math.min(RETRY_BASE_DELAY_MS * (2 ** (attempt - 1)), MAX_RETRY_DELAY_MS);
}

function wait(delayMs) {
    return new Promise(resolve => setTimeout(resolve, delayMs));
}

async function fetchJson(url) {
    for (let attempt = 1; attempt <= MAX_FETCH_ATTEMPTS; attempt += 1) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        try {
            const response = await fetch(url, { signal: controller.signal });
            if (response.status === 429 && attempt < MAX_FETCH_ATTEMPTS) {
                const retryDelayMs = getRetryDelayMs(response, attempt);
                console.warn(
                    `Request to ${redactUrl(url)} returned status 429. ` +
                    `Retrying in ${retryDelayMs}ms (attempt ${attempt + 1}/${MAX_FETCH_ATTEMPTS}).`
                );
                await wait(retryDelayMs);
                continue;
            }
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            if (error?.name === 'AbortError') {
                throw new Error(`Request timed out for ${redactUrl(url)}`);
            }
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    throw new Error(`Request failed after ${MAX_FETCH_ATTEMPTS} attempts`);
}

async function resolveSecretBinding(binding, secretName) {
    if (!binding) return '';
    if (typeof binding === 'string') return binding;
    if (typeof binding.get === 'function') {
        try {
            const value = await binding.get();
            if (typeof value === 'string') return value;
        } catch (e) {
            console.warn('Failed to access secret via direct get().');
        }
        try {
            const value = await binding.get(secretName);
            if (typeof value === 'string') return value;
        } catch (e) {
            console.warn('Failed to access secret via get(name).');
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
    if (!env.HOLIDAY_DATA) {
        throw new Error('Holiday data store not configured; existing dataset was not changed.');
    }
    const dataset = await buildHolidayDataset(env);
    try {
        assertCalendarificPublicationSafe(dataset);
    } catch (error) {
        console.warn(error.message || String(error));
        throw error;
    }

    console.log('Holiday dataset built successfully. Saving to KV...');
    await env.HOLIDAY_DATA.put(HOLIDAY_DATA_KEY, JSON.stringify(dataset));
    console.log('Holiday dataset saved to KV.');
}

function runHolidayRefresh(env, triggerName) {
    console.log(`${triggerName} started: Refreshing holiday dataset...`);
    return refreshHolidayDataset(env).then(() => {
        console.log(`${triggerName} finished successfully.`);
    }).catch((error) => {
        console.error(`${triggerName} failed: ${error.message || String(error)}`);
        throw error;
    });
}

export { fetchJson, resolveSecretBinding };

export default {
    async fetch(request, env, ctx) {
        try {
            const response = await handleRequest(request, env, ctx);
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
        ctx.waitUntil(runHolidayRefresh(env, 'Cron trigger'));
    }
};
