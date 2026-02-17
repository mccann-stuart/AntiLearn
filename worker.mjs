const IMAGE_EXTENSIONS_REGEX = /\.(ico|png|jpg|jpeg|svg|webp)$/;
const JSON_EXTENSIONS_REGEX = /\.json$/;
const HOLIDAY_DATA_KEY = 'holidays';
const CALENDARIFIC_URL = 'https://calendarific.com/api/v2/holidays';
const TALLYFY_URL = 'https://tallyfy.com/national-holidays/api';
const CALENDARIFIC_TYPES = 'national,religious';
const CALENDARIFIC_ENV_KEYS = [
    'calendarific',
    'CALENDARIFIC_API_KEY',
    'CALENDARIFIC_KEY',
    'CALENDARIFIC'
];
const HOLIDAY_COUNTRIES = [
    { code: 'QA', name: 'Qatar' },
    { code: 'AE', name: 'United Arab Emirates' }
];
const YEARS_AHEAD = 5;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

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
    newHeaders.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // Content Security Policy
    newHeaders.set('Content-Security-Policy',
        "default-src 'self'; " +
        "style-src 'self' https://fonts.googleapis.com; " +
        "font-src https://fonts.gstatic.com; " +
        "img-src 'self' data:; " +
        "script-src 'self'; " +
        "connect-src 'self';"
    );

    const cacheControl = getCacheControl(pathname);
    if (cacheControl && !newHeaders.has('Cache-Control')) {
        newHeaders.set('Cache-Control', cacheControl);
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
    const url = new URL(request.url);
    if (url.pathname === '/data/holidays.json') {
        return handleHolidayDataRequest(env);
    }
    return env.ASSETS.fetch(request);
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }
    return response.json();
}

function normalizeCalendarific(holidays) {
    if (!Array.isArray(holidays)) return [];
    return holidays
        .map(holiday => {
            const dateIso = holiday && holiday.date ? holiday.date.iso : null;
            const date = typeof dateIso === 'string' ? dateIso.slice(0, 10) : null;
            if (!date || !DATE_REGEX.test(date)) return null;
            const name = typeof holiday.name === 'string' ? holiday.name : 'Holiday';
            const type = Array.isArray(holiday.type)
                ? holiday.type[0]
                : (typeof holiday.type === 'string' ? holiday.type : 'national');
            return { date, name, type, source: 'calendarific' };
        })
        .filter(Boolean);
}

function normalizeTallyfy(holidays) {
    if (!Array.isArray(holidays)) return [];
    return holidays
        .map(holiday => {
            const date = holiday && typeof holiday.date === 'string' ? holiday.date : null;
            if (!date || !DATE_REGEX.test(date)) return null;
            const name = typeof holiday.name === 'string' ? holiday.name : 'Holiday';
            const type = typeof holiday.type === 'string' ? holiday.type : 'national';
            return { date, name, type, source: 'tallyfy' };
        })
        .filter(Boolean);
}

function mergeHolidayLists(calendarificList, tallyfyList) {
    const byDate = new Map();

    tallyfyList.forEach(item => {
        if (!byDate.has(item.date)) {
            byDate.set(item.date, item);
        }
    });

    calendarificList.forEach(item => {
        if (byDate.has(item.date)) {
            const existing = byDate.get(item.date);
            byDate.set(item.date, { ...item, sourceAlt: existing.source });
        } else {
            byDate.set(item.date, item);
        }
    });

    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function getYearsToFetch() {
    const currentYear = new Date().getUTCFullYear();
    return Array.from({ length: YEARS_AHEAD + 1 }, (_, i) => currentYear + i);
}

async function resolveSecretBinding(binding, secretName) {
    if (!binding) return '';
    if (typeof binding === 'string') return binding;
    if (typeof binding.get === 'function') {
        try {
            const value = await binding.get();
            if (typeof value === 'string') return value;
        } catch (e) {
            // Ignore and try alternate access patterns
        }
        try {
            const value = await binding.get(secretName);
            if (typeof value === 'string') return value;
        } catch (e) {
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

async function fetchCalendarificHolidays(apiKey, countryCode, year) {
    if (!apiKey) return [];
    const url = new URL(CALENDARIFIC_URL);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('country', countryCode);
    url.searchParams.set('year', String(year));
    url.searchParams.set('type', CALENDARIFIC_TYPES);

    const data = await fetchJson(url.toString());
    return normalizeCalendarific(data && data.response ? data.response.holidays : null);
}

async function fetchTallyfyHolidays(countryCode, year) {
    const url = `${TALLYFY_URL}/${countryCode}/${year}.json`;
    const data = await fetchJson(url);
    return normalizeTallyfy(data ? data.holidays : null);
}

async function buildHolidayDataset(env) {
    const years = getYearsToFetch();
    const apiKey = await getCalendarificApiKey(env);
    if (!apiKey) {
        console.warn('Warning: Calendarific API key not found. Skipping Calendarific holidays.');
    }
    const dataset = {
        generatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString().slice(0, 10),
        sources: {
            calendarific: {
                enabled: Boolean(apiKey)
            },
            tallyfy: {
                enabled: true
            }
        },
        countries: {}
    };

    for (const country of HOLIDAY_COUNTRIES) {
        const yearsData = {};
        for (const year of years) {
            let calendarificList = [];
            let tallyfyList = [];
            try {
                calendarificList = await fetchCalendarificHolidays(apiKey, country.code, year);
            } catch (e) {
                console.error(`Failed to fetch Calendarific holidays for ${country.code} ${year}:`, e);
                calendarificList = [];
            }
            try {
                tallyfyList = await fetchTallyfyHolidays(country.code, year);
            } catch (e) {
                tallyfyList = [];
            }
            yearsData[String(year)] = mergeHolidayLists(calendarificList, tallyfyList);
        }

        dataset.countries[country.code] = {
            name: country.name,
            years: yearsData
        };
    }

    return dataset;
}

async function refreshHolidayDataset(env) {
    if (!env.HOLIDAY_DATA) return;
    const dataset = await buildHolidayDataset(env);
    await env.HOLIDAY_DATA.put(HOLIDAY_DATA_KEY, JSON.stringify(dataset));
}

export default {
    async fetch(request, env) {
        try {
            const response = await handleRequest(request, env);
            const pathname = new URL(request.url).pathname;
            return applySecurityHeaders(response, pathname);
        } catch (error) {
            console.error('Worker error:', error);
            return new Response('Internal Server Error', { status: 500 });
        }
    },
    async scheduled(event, env, ctx) {
        ctx.waitUntil(refreshHolidayDataset(env));
    }
};
