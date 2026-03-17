import { normalizeCalendarific, normalizeTallyfy, mergeHolidayLists } from './holiday_utils.mjs';
import {
    COUNTRY_LEVEL_DATASET_LOCATIONS,
    US_NATIONAL_BASELINE,
    US_STATE_DATASET_LOCATIONS
} from './dataset_locations.mjs';

const CALENDARIFIC_URL = 'https://calendarific.com/api/v2/holidays';
const TALLYFY_URL = 'https://tallyfy.com/national-holidays/api';
const CALENDARIFIC_NATIONAL_TYPES = 'national,religious';
const CALENDARIFIC_LOCAL_TYPES = 'local,religious';
const YEARS_AHEAD = 5;
const COUNTRY_LOCATION_CONCURRENCY = 4;
const STATE_LOCATION_CONCURRENCY = 6;
const YEAR_CONCURRENCY = 3;

function redactUrl(urlStr) {
    try {
        const url = new URL(urlStr);
        if (url.searchParams.has('api_key')) {
            url.searchParams.set('api_key', 'REDACTED');
        }
        return url.toString();
    } catch (e) {
        return 'invalid-url';
    }
}

function redactErrorMessage(message, apiKey) {
    if (!apiKey || typeof message !== 'string') return message;
    return message.replaceAll(apiKey, 'REDACTED');
}

function getLogger(logger) {
    return {
        log: typeof logger?.log === 'function' ? logger.log.bind(logger) : () => {},
        warn: typeof logger?.warn === 'function' ? logger.warn.bind(logger) : () => {},
        error: typeof logger?.error === 'function' ? logger.error.bind(logger) : () => {}
    };
}

async function mapWithConcurrency(limit, items, iteratee) {
    const results = new Array(items.length);
    let nextIndex = 0;

    async function worker() {
        while (true) {
            const index = nextIndex;
            nextIndex += 1;
            if (index >= items.length) return;
            results[index] = await iteratee(items[index], index);
        }
    }

    const workerCount = Math.min(limit, items.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    return results;
}

function getYearsToFetch() {
    const currentYear = new Date().getUTCFullYear();
    return Array.from({ length: YEARS_AHEAD + 1 }, (_, i) => currentYear + i);
}

async function fetchCalendarificHolidays(fetchJson, apiKey, request, logger = console) {
    const {
        countryCode,
        year,
        location = '',
        types = CALENDARIFIC_NATIONAL_TYPES
    } = request;

    if (!apiKey) return [];

    const url = new URL(CALENDARIFIC_URL);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('country', countryCode);
    url.searchParams.set('year', String(year));
    url.searchParams.set('type', types);
    if (location) {
        url.searchParams.set('location', location);
    }

    try {
        const data = await fetchJson(url.toString());
        return normalizeCalendarific(data && data.response ? data.response.holidays : null);
    } catch (error) {
        const safeLogger = getLogger(logger);
        const errorMessage = redactErrorMessage(error?.message || String(error), apiKey);
        safeLogger.error(`Failed to fetch Calendarific holidays from ${redactUrl(url.toString())}: ${errorMessage}`);
        throw new Error('Calendarific fetch failed');
    }
}

async function fetchTallyfyHolidays(fetchJson, countryCode, year) {
    const url = `${TALLYFY_URL}/${countryCode}/${year}.json`;
    const data = await fetchJson(url);
    return normalizeTallyfy(data ? data.holidays : null);
}

function createDatasetSkeleton(apiKey) {
    const generatedAt = new Date().toISOString();
    return {
        generatedAt,
        updatedAt: generatedAt.slice(0, 10),
        sources: {
            calendarific: {
                enabled: Boolean(apiKey)
            },
            tallyfy: {
                enabled: true
            }
        },
        locations: {}
    };
}

function createLocationEntry(location, yearsData) {
    return {
        name: location.label,
        countryCode: location.countryCode,
        years: yearsData
    };
}

async function buildHolidayDataset({
    fetchJson,
    apiKey = '',
    logger = console,
    years = getYearsToFetch()
} = {}) {
    if (typeof fetchJson !== 'function') {
        throw new TypeError('fetchJson must be provided');
    }

    const safeLogger = getLogger(logger);
    if (!apiKey) {
        safeLogger.warn('Warning: Calendarific API key not found. Skipping Calendarific holidays.');
    }

    const dataset = createDatasetSkeleton(apiKey);
    const nationalBaselineCache = new Map();

    async function getCountryBaseline(countryCode, year) {
        const cacheKey = `${countryCode}-${year}`;
        if (!nationalBaselineCache.has(cacheKey)) {
            nationalBaselineCache.set(cacheKey, (async () => {
                let calendarificList = [];
                let tallyfyList = [];

                try {
                    calendarificList = await fetchCalendarificHolidays(fetchJson, apiKey, {
                        countryCode,
                        year,
                        types: CALENDARIFIC_NATIONAL_TYPES
                    }, safeLogger);
                } catch (e) {
                    const errorMessage = redactErrorMessage(e?.message || String(e), apiKey);
                    safeLogger.error(`Failed to fetch Calendarific holidays for ${countryCode} ${year}: ${errorMessage}`);
                    calendarificList = [];
                }

                try {
                    tallyfyList = await fetchTallyfyHolidays(fetchJson, countryCode, year);
                } catch (e) {
                    tallyfyList = [];
                }

                return mergeHolidayLists(calendarificList, tallyfyList);
            })());
        }

        return nationalBaselineCache.get(cacheKey);
    }

    async function buildCountryLocation(location) {
        const yearsData = {};
        await mapWithConcurrency(YEAR_CONCURRENCY, years, async (year) => {
            yearsData[String(year)] = await getCountryBaseline(location.countryCode, year);
        });
        safeLogger.log(`Finished processing ${location.label} (${location.datasetKey})`);
        return [location.datasetKey, createLocationEntry(location, yearsData)];
    }

    async function buildUsStateLocation(location) {
        const yearsData = {};
        await mapWithConcurrency(YEAR_CONCURRENCY, years, async (year) => {
            const nationalBaseline = await getCountryBaseline(US_NATIONAL_BASELINE.countryCode, year);
            let overlayList = [];

            try {
                overlayList = await fetchCalendarificHolidays(fetchJson, apiKey, {
                    countryCode: location.countryCode,
                    year,
                    location: location.calendarificLocation,
                    types: CALENDARIFIC_LOCAL_TYPES
                }, safeLogger);
            } catch (e) {
                const errorMessage = redactErrorMessage(e?.message || String(e), apiKey);
                safeLogger.error(`Failed to fetch Calendarific holidays for ${location.datasetKey} ${year}: ${errorMessage}`);
                overlayList = [];
            }

            yearsData[String(year)] = mergeHolidayLists(overlayList, nationalBaseline);
        });
        safeLogger.log(`Finished processing ${location.label} (${location.datasetKey})`);
        return [location.datasetKey, createLocationEntry(location, yearsData)];
    }

    const countryEntries = await mapWithConcurrency(
        COUNTRY_LOCATION_CONCURRENCY,
        COUNTRY_LEVEL_DATASET_LOCATIONS,
        buildCountryLocation
    );

    countryEntries.forEach(([datasetKey, entry]) => {
        dataset.locations[datasetKey] = entry;
    });

    const stateEntries = await mapWithConcurrency(
        STATE_LOCATION_CONCURRENCY,
        US_STATE_DATASET_LOCATIONS,
        buildUsStateLocation
    );

    stateEntries.forEach(([datasetKey, entry]) => {
        dataset.locations[datasetKey] = entry;
    });

    return dataset;
}

export {
    CALENDARIFIC_LOCAL_TYPES,
    CALENDARIFIC_NATIONAL_TYPES,
    CALENDARIFIC_URL,
    TALLYFY_URL,
    YEARS_AHEAD,
    buildHolidayDataset,
    fetchCalendarificHolidays,
    fetchTallyfyHolidays,
    getYearsToFetch,
    redactUrl
};
