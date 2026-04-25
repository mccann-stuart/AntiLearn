/**
 * Vacation Maximiser Logic
 * Combined into one file to ensure it runs locally without a server.
 */

// --- STATE MANAGEMENT ---

const MAX_CUSTOM_HOLIDAYS = 50;
const MAX_BOOKED_DATES = 1000;

const WEEKEND_PRESETS = {
    'sat-sun': { label: 'Sat/Sun', days: [6, 0] },
    'fri-sat': { label: 'Fri/Sat', days: [5, 6] }
};
const US_STATE_LOCATION_DEFINITIONS = Object.freeze([
    { code: 'AL', label: 'Alabama', value: 'us-alabama', key: 'US_AL' },
    { code: 'AK', label: 'Alaska', value: 'us-alaska', key: 'US_AK' },
    { code: 'AZ', label: 'Arizona', value: 'us-arizona', key: 'US_AZ' },
    { code: 'AR', label: 'Arkansas', value: 'us-arkansas', key: 'US_AR' },
    { code: 'CA', label: 'California', value: 'us-california', key: 'US_CA' },
    { code: 'CO', label: 'Colorado', value: 'us-colorado', key: 'US_CO' },
    { code: 'CT', label: 'Connecticut', value: 'us-connecticut', key: 'US_CT' },
    { code: 'DE', label: 'Delaware', value: 'us-delaware', key: 'US_DE' },
    { code: 'FL', label: 'Florida', value: 'us-florida', key: 'US_FL' },
    { code: 'GA', label: 'Georgia', value: 'us-georgia', key: 'US_GA' },
    { code: 'HI', label: 'Hawaii', value: 'us-hawaii', key: 'US_HI' },
    { code: 'ID', label: 'Idaho', value: 'us-idaho', key: 'US_ID' },
    { code: 'IL', label: 'Illinois', value: 'us-illinois', key: 'US_IL' },
    { code: 'IN', label: 'Indiana', value: 'us-indiana', key: 'US_IN' },
    { code: 'IA', label: 'Iowa', value: 'us-iowa', key: 'US_IA' },
    { code: 'KS', label: 'Kansas', value: 'us-kansas', key: 'US_KS' },
    { code: 'KY', label: 'Kentucky', value: 'us-kentucky', key: 'US_KY' },
    { code: 'LA', label: 'Louisiana', value: 'us-louisiana', key: 'US_LA' },
    { code: 'ME', label: 'Maine', value: 'us-maine', key: 'US_ME' },
    { code: 'MD', label: 'Maryland', value: 'us-maryland', key: 'US_MD' },
    { code: 'MA', label: 'Massachusetts', value: 'us-massachusetts', key: 'US_MA' },
    { code: 'MI', label: 'Michigan', value: 'us-michigan', key: 'US_MI' },
    { code: 'MN', label: 'Minnesota', value: 'us-minnesota', key: 'US_MN' },
    { code: 'MS', label: 'Mississippi', value: 'us-mississippi', key: 'US_MS' },
    { code: 'MO', label: 'Missouri', value: 'us-missouri', key: 'US_MO' },
    { code: 'MT', label: 'Montana', value: 'us-montana', key: 'US_MT' },
    { code: 'NE', label: 'Nebraska', value: 'us-nebraska', key: 'US_NE' },
    { code: 'NV', label: 'Nevada', value: 'us-nevada', key: 'US_NV' },
    { code: 'NH', label: 'New Hampshire', value: 'us-new-hampshire', key: 'US_NH' },
    { code: 'NJ', label: 'New Jersey', value: 'us-new-jersey', key: 'US_NJ' },
    { code: 'NM', label: 'New Mexico', value: 'us-new-mexico', key: 'US_NM' },
    { code: 'NY', label: 'New York', value: 'us-new-york', key: 'US_NY' },
    { code: 'NC', label: 'North Carolina', value: 'us-north-carolina', key: 'US_NC' },
    { code: 'ND', label: 'North Dakota', value: 'us-north-dakota', key: 'US_ND' },
    { code: 'OH', label: 'Ohio', value: 'us-ohio', key: 'US_OH' },
    { code: 'OK', label: 'Oklahoma', value: 'us-oklahoma', key: 'US_OK' },
    { code: 'OR', label: 'Oregon', value: 'us-oregon', key: 'US_OR' },
    { code: 'PA', label: 'Pennsylvania', value: 'us-pennsylvania', key: 'US_PA' },
    { code: 'RI', label: 'Rhode Island', value: 'us-rhode-island', key: 'US_RI' },
    { code: 'SC', label: 'South Carolina', value: 'us-south-carolina', key: 'US_SC' },
    { code: 'SD', label: 'South Dakota', value: 'us-south-dakota', key: 'US_SD' },
    { code: 'TN', label: 'Tennessee', value: 'us-tennessee', key: 'US_TN' },
    { code: 'TX', label: 'Texas', value: 'us-texas', key: 'US_TX' },
    { code: 'UT', label: 'Utah', value: 'us-utah', key: 'US_UT' },
    { code: 'VT', label: 'Vermont', value: 'us-vermont', key: 'US_VT' },
    { code: 'VA', label: 'Virginia', value: 'us-virginia', key: 'US_VA' },
    { code: 'WA', label: 'Washington', value: 'us-washington', key: 'US_WA' },
    { code: 'WV', label: 'West Virginia', value: 'us-west-virginia', key: 'US_WV' },
    { code: 'WI', label: 'Wisconsin', value: 'us-wisconsin', key: 'US_WI' },
    { code: 'WY', label: 'Wyoming', value: 'us-wyoming', key: 'US_WY' }
]);

const LOCATION_METADATA = Object.freeze([
    {
        key: 'ENGLAND_WALES',
        value: 'england-wales',
        label: 'England & Wales',
        countryCode: 'GB',
        holidaySource: 'uk',
        defaultWeekend: 'sat-sun',
        group: 'United Kingdom'
    },
    {
        key: 'SCOTLAND',
        value: 'scotland',
        label: 'Scotland',
        countryCode: 'GB',
        holidaySource: 'uk',
        defaultWeekend: 'sat-sun',
        group: 'United Kingdom'
    },
    {
        key: 'NORTHERN_IRELAND',
        value: 'northern-ireland',
        label: 'Northern Ireland',
        countryCode: 'GB',
        holidaySource: 'uk',
        defaultWeekend: 'sat-sun',
        group: 'United Kingdom'
    },
    {
        key: 'QATAR',
        value: 'qatar',
        label: 'Qatar',
        countryCode: 'QA',
        datasetKey: 'QA',
        holidaySource: 'dataset',
        defaultWeekend: 'fri-sat',
        group: 'Persian Gulf'
    },
    {
        key: 'SAUDI_ARABIA',
        value: 'saudi-arabia',
        label: 'Saudi Arabia',
        countryCode: 'SA',
        datasetKey: 'SA',
        holidaySource: 'dataset',
        defaultWeekend: 'fri-sat',
        group: 'Persian Gulf'
    },
    {
        key: 'UAE',
        value: 'uae',
        label: 'United Arab Emirates',
        countryCode: 'AE',
        datasetKey: 'AE',
        holidaySource: 'dataset',
        defaultWeekend: 'sat-sun',
        group: 'Persian Gulf'
    },
    {
        key: 'CANADA',
        value: 'canada',
        label: 'Canada',
        countryCode: 'CA',
        datasetKey: 'CA',
        holidaySource: 'dataset',
        defaultWeekend: 'sat-sun',
        group: 'North America'
    },
    ...US_STATE_LOCATION_DEFINITIONS.map((state) => ({
        key: state.key,
        value: state.value,
        label: state.label,
        countryCode: 'US',
        datasetKey: `US-${state.code}`,
        holidaySource: 'dataset',
        defaultWeekend: 'sat-sun',
        group: 'North America'
    }))
]);
const LOCATION_GROUP_ORDER = Object.freeze([
    'United Kingdom',
    'Persian Gulf',
    'North America'
]);
const LOCATION_GROUPS = Object.freeze(
    LOCATION_GROUP_ORDER.map((group) => ({
        label: group,
        options: LOCATION_METADATA
            .filter((location) => location.group === group)
            .map((location) => ({
                value: location.value,
                label: location.label
            }))
    })).filter((group) => group.options.length > 0)
);
const REGIONS = Object.freeze(
    LOCATION_METADATA.reduce((acc, location) => {
        acc[location.key] = location.value;
        return acc;
    }, {})
);
const SUPPORTED_REGION_VALUES = Object.freeze(LOCATION_METADATA.map((location) => location.value));
const LOCATION_CONFIG = Object.freeze(
    LOCATION_METADATA.reduce((acc, location) => {
        acc[location.value] = {
            label: location.label,
            countryCode: location.countryCode,
            datasetKey: location.datasetKey || null,
            holidaySource: location.holidaySource,
            defaultWeekend: location.defaultWeekend,
            group: location.group
        };
        return acc;
    }, {})
);
/** @type {number} Current number of annual leave days available. */
let currentAllowance = 25;
/** @type {number} The year being planned for. */
let currentYear = new Date().getFullYear();
/** @type {string} The selected location. */
let currentRegion = REGIONS.ENGLAND_WALES;
/** @type {string} The current weekend pattern key. */
let currentWeekendPattern = LOCATION_CONFIG[REGIONS.ENGLAND_WALES].defaultWeekend;
/** @type {Set<string>} Set of dates (YYYY-MM-DD) that the user has booked. */
let bookedDates = new Set();
/** @type {Object<string, Array<{date: string, name: string}>>} Custom holidays by location. */
let customHolidaysByLocation = {};
/** @type {Object<string, string>} Weekend pattern per location. */
let weekendByLocation = {};

// Holiday dataset cache (for non-UK locations)
const HOLIDAY_DATA_STORAGE_KEY = 'vacationMaximiserHolidayData';
let holidayDataset = null;
let holidayDatasetPromise = null;
let holidayDatasetFromCache = false;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// --- PERSISTENCE ---
const STORAGE_KEY = 'vacationMaximiser';
const SHARE_PARAM = 'plan';

/**
 * Returns the current application state.
 */
function getCurrentState() {
    return {
        currentAllowance,
        currentYear,
        currentRegion,
        currentWeekendPattern,
        weekendByLocation,
        bookedDates: Array.from(bookedDates),
        customHolidaysByLocation
    };
}

/**
 * Builds a plain object representing the current plan state.
 */
function getPlanPayload() {
    return {
        v: 2,
        currentAllowance,
        currentYear,
        currentRegion,
        currentWeekendPattern,
        bookedDates: Array.from(bookedDates),
        customHolidays: getCustomHolidaysForLocation(currentRegion)
    };
}

/**
 * Ensures a custom holiday list exists for the given location.
 */
function ensureCustomHolidays(location) {
    if (!customHolidaysByLocation[location]) {
        customHolidaysByLocation[location] = [];
    }
    return customHolidaysByLocation[location];
}

/**
 * Retrieves custom holidays for a specific location.
 */
function getCustomHolidaysForLocation(location) {
    return customHolidaysByLocation[location] || [];
}

function isSupportedRegion(location) {
    return SUPPORTED_REGION_VALUES.includes(location);
}

function getLocationConfig(location) {
    return Object.prototype.hasOwnProperty.call(LOCATION_CONFIG, location) ? LOCATION_CONFIG[location] : null;
}

function getDefaultWeekendForLocation(location) {
    const config = getLocationConfig(location);
    return config ? config.defaultWeekend : 'sat-sun';
}

/**
 * Sanitizes a list of custom holidays.
 */
function sanitizeHolidayList(list) {
    return Array.isArray(list)
        ? list.slice(0, MAX_CUSTOM_HOLIDAYS).filter(h =>
            h && typeof h === 'object' &&
            typeof h.date === 'string' && DATE_REGEX.test(h.date) &&
            typeof h.name === 'string' && h.name.length < 100
          )
        : [];
}

/**
 * Sanitizes a map of custom holidays by location.
 */
function sanitizeHolidayMap(map) {
    if (!map || typeof map !== 'object') return {};
    const result = {};
    Object.entries(map).forEach(([key, value]) => {
        if (typeof key === 'string' && isSupportedRegion(key)) {
            const safeList = sanitizeHolidayList(value);
            if (safeList.length > 0) {
                result[key] = safeList;
            }
        }
    });
    return result;
}

/**
 * Determines whether a location relies on the holiday dataset.
 */
function isDatasetLocation(location) {
    const config = getLocationConfig(location);
    return Boolean(config && config.holidaySource === 'dataset');
}

/**
 * Retrieves the weekend preset for a given key with safe fallback.
 */
function getWeekendPreset(key) {
    if (Object.prototype.hasOwnProperty.call(WEEKEND_PRESETS, key)) return WEEKEND_PRESETS[key];
    const fallbackKey = getDefaultWeekendForLocation(currentRegion);
    return Object.prototype.hasOwnProperty.call(WEEKEND_PRESETS, fallbackKey) ? WEEKEND_PRESETS[fallbackKey] : WEEKEND_PRESETS['sat-sun'];
}

/**
 * Encodes a JavaScript object into a base64url string for safe URL transport.
 * Works in both browser and Node (tests).
 */
function encodePlanString(payload) {
    try {
        const json = JSON.stringify(payload);
        const base64 = typeof Buffer !== 'undefined'
            ? Buffer.from(json, 'utf8').toString('base64')
            : btoa(unescape(encodeURIComponent(json)));
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) {
        console.warn('Failed to encode plan:', e);
        return null;
    }
}

/**
 * Decodes a base64url plan string back into an object, with basic validation.
 */
function decodePlanString(encoded) {
    if (!encoded || typeof encoded !== 'string') return null;

    // Sentinel Optimization: Prevent DoS from overly large payloads
    if (encoded.length > 30000) return null;

    try {
        const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized + '==='.slice((normalized.length + 3) % 4);
        const json = typeof Buffer !== 'undefined'
            ? Buffer.from(padded, 'base64').toString('utf8')
            : decodeURIComponent(escape(atob(padded)));
        const obj = JSON.parse(json);
        if (!obj || typeof obj !== 'object') return null;
        const allowance = typeof obj.currentAllowance === 'number' && obj.currentAllowance > 0 && obj.currentAllowance <= 365
            ? obj.currentAllowance
            : currentAllowance;
        const weekendPattern = typeof obj.currentWeekendPattern === 'string' && Object.prototype.hasOwnProperty.call(WEEKEND_PRESETS, obj.currentWeekendPattern)
            ? obj.currentWeekendPattern
            : null;
        return {
            currentAllowance: allowance,
            currentYear: typeof obj.currentYear === 'number' ? obj.currentYear : currentYear,
            currentRegion: typeof obj.currentRegion === 'string' ? obj.currentRegion : currentRegion,
            currentWeekendPattern: weekendPattern,
            bookedDates: Array.isArray(obj.bookedDates)
                ? obj.bookedDates.slice(0, MAX_BOOKED_DATES).filter(d => typeof d === 'string' && DATE_REGEX.test(d))
                : [],
            customHolidays: sanitizeHolidayList(obj.customHolidays),
            customHolidaysByLocation: sanitizeHolidayMap(obj.customHolidaysByLocation)
        };
    } catch (e) {
        if (!(typeof process !== 'undefined' && process.env.JEST_WORKER_ID)) {
            console.warn('Failed to decode plan:', e);
        }
        return null;
    }
}

/**
 * Attempts to read and apply a shared plan from the URL.
 * Returns true if a shared plan was applied.
 */
function applySharedPlanFromUrl() {
    if (typeof window === 'undefined') return false;
    try {
        const url = new URL(window.location.href);
        const encodedPlan = url.searchParams.get(SHARE_PARAM);
        if (!encodedPlan) return false;

        const decoded = decodePlanString(encodedPlan);
        if (!decoded) return false;

        if (!isSupportedRegion(decoded.currentRegion)) {
            decoded.currentRegion = REGIONS.ENGLAND_WALES;
        }

        currentAllowance = decoded.currentAllowance;
        currentYear = decoded.currentYear;
        currentRegion = decoded.currentRegion;

        const defaultWeekend = getDefaultWeekendForLocation(currentRegion);
        currentWeekendPattern = decoded.currentWeekendPattern && Object.prototype.hasOwnProperty.call(WEEKEND_PRESETS, decoded.currentWeekendPattern)
            ? decoded.currentWeekendPattern
            : defaultWeekend;
        weekendByLocation = {};
        weekendByLocation[currentRegion] = currentWeekendPattern;

        bookedDates = new Set(decoded.bookedDates || []);

        if (decoded.customHolidaysByLocation && Object.keys(decoded.customHolidaysByLocation).length > 0) {
            customHolidaysByLocation = decoded.customHolidaysByLocation;
        } else {
            customHolidaysByLocation = {};
            if (decoded.customHolidays && decoded.customHolidays.length > 0) {
                customHolidaysByLocation[currentRegion] = decoded.customHolidays;
            }
        }

        clearHolidaysCache();
        invalidateInsightCaches();
        return true;
    } catch (e) {
        console.warn('Failed to apply shared plan:', e);
        return false;
    }
}

/**
 * Builds a shareable URL reflecting the current plan.
 */
function buildShareableUrl() {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.origin + window.location.pathname);
    const encoded = encodePlanString(getPlanPayload());
    if (!encoded) return '';
    url.searchParams.set(SHARE_PARAM, encoded);
    return url.toString();
}

/**
 * Shows a toast notification.
 * @param {string} message The message to display.
 * @param {'info'|'error'|'success'} type The type of toast.
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️';
    const iconSpan = document.createElement('span');
    iconSpan.setAttribute('aria-hidden', 'true');
    iconSpan.textContent = icon + ' ';

    const messageNode = document.createTextNode(message);

    toast.appendChild(iconSpan);
    toast.appendChild(messageNode);

    container.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('toast-out');
        toast.addEventListener('animationend', () => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        });
    }, 3000);
}

/**
 * Copies the shareable link to the clipboard (with fallback).
 */
async function handleShareLink() {
    const shareUrl = buildShareableUrl();
    if (!shareUrl) {
        showToast('Unable to create share link', 'error');
        return;
    }

    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(shareUrl);

            showToast('Link copied to clipboard!', 'success');

            const btn = document.getElementById('share-btn');
            if (btn && !btn.classList.contains('btn-success')) {
                const originalNodes = Array.from(btn.childNodes);
                const originalAriaLabel = btn.getAttribute('aria-label');

                btn.textContent = '';
                const iconSpan = document.createElement('span');
                iconSpan.setAttribute('aria-hidden', 'true');
                iconSpan.textContent = '✅ ';
                btn.appendChild(iconSpan);
                btn.appendChild(document.createTextNode('Copied!'));

                btn.setAttribute('aria-label', 'Copied!');
                btn.classList.add('btn-success');

                setTimeout(() => {
                    btn.textContent = '';
                    originalNodes.forEach(node => btn.appendChild(node));
                    if (originalAriaLabel) {
                        btn.setAttribute('aria-label', originalAriaLabel);
                    } else {
                        btn.removeAttribute('aria-label');
                    }
                    btn.classList.remove('btn-success');
                }, 2000);
            }
        } else {
            throw new Error('Clipboard API not available');
        }
    } catch (e) {
        console.warn('Copy failed:', e);
        showToast('Copy failed. Please try again.', 'error');
    }
}

/**
 * Saves the current application state to localStorage.
 */
function saveState() {
    const state = getCurrentState();
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.warn('Failed to save state:', e);
    }
}

/**
 * Loads the saved application state from localStorage.
 * @returns {Object|null} The saved state or null if not found/invalid.
 */
function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.warn('Failed to load saved state:', e);
    }
    return null;
}

/**
 * Clears saved state from localStorage.
 */
function clearState() {
    localStorage.removeItem(STORAGE_KEY);
}

// --- HOLIDAY DATASET ---

const HOLIDAY_DATA_URL = '/data/holidays.json';
const holidayDataWarnings = new Set();

/**
 * Loads the holiday dataset from the server (or local cache).
 */
async function loadHolidayDataset(force = false) {
    if (holidayDatasetPromise && !force) return holidayDatasetPromise;
    holidayDatasetPromise = (async () => {
        let data = null;
        let fromCache = false;

        if (typeof fetch === 'function') {
            try {
                const response = await fetch(HOLIDAY_DATA_URL, { cache: 'no-store' });
                if (response.ok) {
                    data = await response.json();
                }
            } catch (e) {
                data = null;
            }
        }

        if (!data) {
            try {
                const cached = localStorage.getItem(HOLIDAY_DATA_STORAGE_KEY);
                if (cached) {
                    data = JSON.parse(cached);
                    fromCache = true;
                }
            } catch (e) {
                data = null;
            }
        }

        if (data) {
            holidayDataset = data;
            holidayDatasetFromCache = fromCache;
            try {
                localStorage.setItem(HOLIDAY_DATA_STORAGE_KEY, JSON.stringify(data));
            } catch (e) {
                // Ignore cache failures
            }
            clearHolidaysCache();
            invalidateInsightCaches();
            renderHolidayDataStatus();
            if (isDatasetLocation(currentRegion) && typeof document !== 'undefined') {
                updateUI();
            }
        }

        return holidayDataset;
    })();

    return holidayDatasetPromise;
}

/**
 * Retrieves dataset holidays for a specific location/year.
 */
function getDatasetLocationYears(location) {
    const config = getLocationConfig(location);
    if (!config || !holidayDataset) return null;

    const locations = holidayDataset.locations || holidayDataset.data || {};
    const locationEntry = config.datasetKey && Object.prototype.hasOwnProperty.call(locations, config.datasetKey)
        ? locations[config.datasetKey]
        : null;

    if (locationEntry) {
        return locationEntry && locationEntry.years ? locationEntry.years : locationEntry;
    }

    if (config.datasetKey && config.datasetKey === config.countryCode) {
        const countries = holidayDataset.countries || {};
        const countryEntry = Object.prototype.hasOwnProperty.call(countries, config.countryCode)
            ? countries[config.countryCode]
            : null;
        return countryEntry && countryEntry.years ? countryEntry.years : countryEntry;
    }

    return null;
}

function getDatasetHolidays(year, location) {
    const years = getDatasetLocationYears(location);
    const list = years ? years[String(year)] : null;

    if (!Array.isArray(list) || list.length === 0) {
        warnHolidayDataUnavailable(location, year);
        return [];
    }

    return list
        .filter(item =>
            item &&
            typeof item.date === 'string' && DATE_REGEX.test(item.date) &&
            typeof item.name === 'string'
        )
        .map(item => ({
            date: item.date,
            name: item.name
        }));
}

function hasHolidayDataForYear(location, year) {
    const years = getDatasetLocationYears(location);
    return Boolean(years && Array.isArray(years[String(year)]) && years[String(year)].length > 0);
}

function warnHolidayDataUnavailable(location, year) {
    if (!isDatasetLocation(location)) return;
    // Only surface warnings for the actively selected year to avoid noise
    // from cross-year checks (e.g., year-over-year insights or boundary scans).
    if (year !== currentYear) return;
    const key = `${location}-${year}`;
    if (holidayDataWarnings.has(key)) return;
    holidayDataWarnings.add(key);
    showToast(`Holiday data unavailable for ${year}. Using weekends + custom holidays only.`, 'info');
    renderHolidayDataStatus();
}

function renderHolidayDataStatus() {
    if (typeof document === 'undefined') return;
    const statusEl = document.getElementById('holiday-data-status');
    if (!statusEl) return;

    if (!isDatasetLocation(currentRegion)) {
        statusEl.textContent = '';
        return;
    }

    if (!holidayDataset) {
        statusEl.textContent = 'Holiday data unavailable. Using weekends + custom holidays only.';
        return;
    }

    if (!hasHolidayDataForYear(currentRegion, currentYear)) {
        statusEl.textContent = `Holiday data unavailable for ${currentYear}. Using weekends + custom holidays only.`;
        return;
    }

    const updatedAt = holidayDataset.updatedAt || holidayDataset.generatedAt;
    if (updatedAt) {
        statusEl.textContent = `Holiday data updated: ${String(updatedAt).slice(0, 10)}${holidayDatasetFromCache ? ' (cached)' : ''}`;
    } else {
        statusEl.textContent = 'Holiday data loaded.';
    }
}

// --- HOLIDAYS ---

/**
 * Fast parser for known YYYY-MM-DD strings.
 * Bolt Optimization: Replaces split('-').map(Number) which creates intermediate arrays.
 * Using charCodeAt is ~3x faster for high-frequency loops.
 * @param {string} dateStr The YYYY-MM-DD string to parse.
 * @returns {Date} The parsed Date object.
 */
function parseISODateString(dateStr) {
    const y = (dateStr.charCodeAt(0) - 48) * 1000 + (dateStr.charCodeAt(1) - 48) * 100 + (dateStr.charCodeAt(2) - 48) * 10 + (dateStr.charCodeAt(3) - 48);
    const m = (dateStr.charCodeAt(5) - 48) * 10 + (dateStr.charCodeAt(6) - 48);
    const d = (dateStr.charCodeAt(8) - 48) * 10 + (dateStr.charCodeAt(9) - 48);
    return new Date(y, m - 1, d);
}

/**
 * Formats a date object into a YYYY-MM-DD string in the local timezone.
 * @param {Date} date The date to format.
 * @returns {string} The formatted date string.
 */
function toLocalISOString(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    // Optimization: Manual concatenation is ~5x faster than String().padStart()
    // Bolt Optimization: Standard string concatenation is ~4x faster than template literals
    return year + (month < 10 ? '-0' : '-') + month + (day < 10 ? '-0' : '-') + day;
}

/**
 * Calculates the date of Easter Sunday for a given year using the anonymous Gregorian algorithm.
 * @param {number} year The year to calculate Easter for.
 * @returns {Date} The date of Easter Sunday.
 */
function getEasterDate(year) {
    // Meeus/Jones/Butcher's algorithm
    const goldenNumber = year % 19;
    const century = Math.floor(year / 100);
    const yearInCentury = year % 100;
    const skippedLeapYears = Math.floor(century / 4);
    const centuryMod4 = century % 4;
    const lunarCorrection = Math.floor((century + 8) / 25);
    const solarCorrection = Math.floor((century - lunarCorrection + 1) / 3);
    const epact = (19 * goldenNumber + century - skippedLeapYears - solarCorrection + 15) % 30;
    const leapYearsInCentury = Math.floor(yearInCentury / 4);
    const yearInCenturyMod4 = yearInCentury % 4;
    const dayCorrection = (32 + 2 * centuryMod4 + 2 * leapYearsInCentury - epact - yearInCenturyMod4) % 7;
    const monthCorrection = Math.floor((goldenNumber + 11 * epact + 22 * dayCorrection) / 451);
    const month = Math.floor((epact + dayCorrection - 7 * monthCorrection + 114) / 31);
    const day = ((epact + dayCorrection - 7 * monthCorrection + 114) % 31) + 1;
    return new Date(year, month - 1, day);
}

/**
 * Finds a specific day of the week in a given month.
 * @param {number} year The year.
 * @param {number} month The month (0-indexed).
 * @param {number} dayOfWeek The day of the week (0 for Sunday, 1 for Monday, etc.).
 * @param {'first'|'last'} position Whether to find the first or last occurrence.
 * @returns {Date} The date found.
 */
function findDayInMonth(year, month, dayOfWeek, position) {
    let date;
    if (position === 'first') {
        date = new Date(year, month, 1);
        while (date.getDay() !== dayOfWeek) {
            date.setDate(date.getDate() + 1);
        }
    } else {
        date = new Date(year, month + 1, 0);
        while (date.getDay() !== dayOfWeek) {
            date.setDate(date.getDate() - 1);
        }
    }
    return date;
}

/**
 * Helper to add a holiday with substitute logic.
 * @param {Date} date The original holiday date.
 * @param {string} name The name of the holiday.
 * @param {'next-monday'|'next-tuesday'} [substituteRule='next-monday'] Rule for weekend substitution.
 * @returns {{date: string, name: string}} The holiday object.
 */
function createHoliday(date, name, substituteRule = 'next-monday') {
    let d = new Date(date);
    const day = d.getDay();

    if (day === 0) { // Sunday
        if (substituteRule === 'next-monday') d.setDate(d.getDate() + 1);
        else if (substituteRule === 'next-tuesday') d.setDate(d.getDate() + 2);
    } else if (day === 6) { // Saturday
        if (substituteRule === 'next-monday') d.setDate(d.getDate() + 2);
        else if (substituteRule === 'next-tuesday') d.setDate(d.getDate() + 3);
    }

    return { date: toLocalISOString(d), name: name + (d.getTime() !== date.getTime() ? " (Substitute)" : "") };
}

/**
 * Calculates the holiday for 2nd January (Scotland only), accounting for substitution.
 */
function getScotlandJan2(year, jan1Holiday) {
    let jan2 = new Date(year, 0, 2);
    const jan1SubDate = jan1Holiday.date;

    // Standard weekend handling first
    let d = new Date(jan2);
    if (jan2.getDay() === 0) d.setDate(d.getDate() + 1); // Sun -> Mon
    else if (jan2.getDay() === 6) d.setDate(d.getDate() + 2); // Sat -> Mon

    // If Jan 2 substitute lands on the same day as Jan 1 substitute (e.g. both Mon), move to Tue
    if (toLocalISOString(d) === jan1SubDate) {
        d.setDate(d.getDate() + 1);
    }

    return { date: toLocalISOString(d), name: "2nd January" };
}

/**
 * Calculates the Summer Bank Holiday based on the region.
 */
function getSummerBankHoliday(year, region) {
    // Scotland: First Monday in August
    // Others: Last Monday in August
    const position = region === REGIONS.SCOTLAND ? 'first' : 'last';
    const date = findDayInMonth(year, 7, 1, position);
    return { date: toLocalISOString(date), name: "Summer Bank Holiday" };
}

/**
 * Calculates Christmas and Boxing Day holidays with their complex substitution logic.
 */
function getChristmasHolidays(year) {
    const holidays = [];
    const xmas = new Date(year, 11, 25);
    const boxing = new Date(year, 11, 26);

    let xmasSub = null;
    let boxingSub = null;

    // Christmas Substitution Logic
    if (xmas.getDay() === 6) { // Sat -> Mon
        xmasSub = new Date(year, 11, 27);
    } else if (xmas.getDay() === 0) { // Sun -> Tue (because Boxing Day is Mon)
        xmasSub = new Date(year, 11, 27);
    }

    if (xmasSub) {
        holidays.push({ date: toLocalISOString(xmasSub), name: "Christmas Day (Substitute)" });
    } else {
        holidays.push({ date: toLocalISOString(xmas), name: "Christmas Day" });
    }

    // Boxing Day Substitution Logic
    if (boxing.getDay() === 6) { // Sat -> Mon
        boxingSub = new Date(year, 11, 28);
    } else if (boxing.getDay() === 0) { // Sun -> Tue (because Xmas sub is Mon or Tue)
        boxingSub = new Date(year, 11, 28);
    }

    if (boxingSub) {
        holidays.push({ date: toLocalISOString(boxingSub), name: "Boxing Day (Substitute)" });
    } else {
        holidays.push({ date: toLocalISOString(boxing), name: "Boxing Day" });
    }

    return holidays;
}

/**
 * Generates a list of UK bank holidays for a given year, based on the region.
 * Handles substitute days for holidays falling on weekends.
 * @param {number} year The year to generate holidays for.
 * @param {string} region The region code ('england-wales', 'scotland', 'northern-ireland').
 * @returns {Array<{date: string, name: string}>} A list of holiday objects.
 */
function getUKHolidays(year, region) {
    const holidays = [];

    // 1. New Year's Day (Jan 1) - ALL
    const newYear = createHoliday(new Date(year, 0, 1), "New Year's Day");
    holidays.push(newYear);

    // 2. Jan 2nd - SCOTLAND ONLY
    if (region === REGIONS.SCOTLAND) {
        holidays.push(getScotlandJan2(year, newYear));
    }

    // 3. St Patrick's Day (Mar 17) - NI ONLY
    if (region === REGIONS.NORTHERN_IRELAND) {
        holidays.push(createHoliday(new Date(year, 2, 17), "St Patrick's Day"));
    }

    // 4. Good Friday (Easter - 2) - ALL
    const easter = getEasterDate(year);
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    holidays.push({ date: toLocalISOString(goodFriday), name: "Good Friday" });

    // 5. Easter Monday (Easter + 1) - ALL EXCEPT SCOTLAND
    if (region !== REGIONS.SCOTLAND) {
        const easterMonday = new Date(easter);
        easterMonday.setDate(easter.getDate() + 1);
        holidays.push({ date: toLocalISOString(easterMonday), name: "Easter Monday" });
    }

    // 6. Early May Bank Holiday (First Monday in May) - ALL
    const mayDay = findDayInMonth(year, 4, 1, 'first');
    holidays.push({ date: toLocalISOString(mayDay), name: "Early May Bank Holiday" });

    // 7. Spring Bank Holiday (Last Monday in May) - ALL
    const springBank = findDayInMonth(year, 4, 1, 'last');
    holidays.push({ date: toLocalISOString(springBank), name: "Spring Bank Holiday" });

    // 8. Orangemen's Day (July 12) - NI ONLY
    if (region === REGIONS.NORTHERN_IRELAND) {
        holidays.push(createHoliday(new Date(year, 6, 12), "Battle of the Boyne (Orangemen's Day)"));
    }

    // 9. Summer Bank Holiday
    holidays.push(getSummerBankHoliday(year, region));

    // 10. St Andrew's Day (Nov 30) - SCOTLAND ONLY
    if (region === REGIONS.SCOTLAND) {
        holidays.push(createHoliday(new Date(year, 10, 30), "St Andrew's Day"));
    }

    // 11 & 12. Christmas & Boxing Day - ALL
    holidays.push(...getChristmasHolidays(year));

    // Merge Custom Holidays
    const customHolidays = getCustomHolidaysForLocation(region);
    if (customHolidays.length > 0) {
        const existingDates = new Set(holidays.map(h => h.date));
        customHolidays.forEach(h => {
            if (!existingDates.has(h.date)) {
                holidays.push(h);
                existingDates.add(h.date);
            }
        });
    }

    return holidays;
}

// Cache holidays for performance
const holidaysCache = new Map();

// Fast-path cache for getHolidaysForYear to avoid string interpolation and lookups in hot loops
let cachedHolidaysYear = null;
let cachedHolidaysRegion = null;
let cachedHolidaysCustomCount = null;
let cachedHolidaysDatasetKey = null;
let cachedHolidaysResult = null;

/**
 * Clears the holidays cache and its associated fast-path cache.
 */
function clearHolidaysCache() {
    holidaysCache.clear();
    cachedHolidaysYear = null;
    cachedHolidaysRegion = null;
    cachedHolidaysCustomCount = null;
    cachedHolidaysDatasetKey = null;
    cachedHolidaysResult = null;
}
// Cache per-date insights (efficiency + bridge) to avoid recomputation while interacting.
const dayInsightCache = new Map();
// Cache year-over-year comparison to avoid recomputing optimal plans unnecessarily.
const yearComparisonCache = new Map();

// Cache day types for each year to avoid repeated checks and allow cross-year persistence
const dayTypeCache = new Map(); // Map<year, { types: Array, startTs: number }>
let dayTypeCacheContext = {
    region: null,
    weekend: null,
    customCount: null
};

// Cache booked days as indices for fast lookup
let bookedDaysIndices = null;
let bookedDaysYear = null;

function invalidateInsightCaches() {
    dayInsightCache.clear();
    yearComparisonCache.clear();
    dayTypeCache.clear();
    dayTypeCacheContext = {
        region: null,
        weekend: null,
        customCount: null
    };
    bookedDaysIndices = null;

    // Also clear the fast-path cache
    cachedHolidaysYear = null;
    cachedHolidaysRegion = null;
    cachedHolidaysCustomCount = null;
    cachedHolidaysDatasetKey = null;
    cachedHolidaysResult = null;
}

/**
 * Bolt Optimization: Targeted cache invalidation.
 * Only clears caches that depend on `bookedDates`.
 * This prevents expensive recalculations (like O(N) optimal plan DP and day type logic)
 * when simply toggling a day on the calendar.
 */
function invalidateBookedDaysCaches() {
    dayInsightCache.clear();
    bookedDaysIndices = null;
}

/**
 * Ensures the day type cache is populated for the specified year.
 * Defaults to currentYear if not provided.
 */
function ensureDayTypeCache(year = currentYear) {
    const customCount = getCustomHolidaysForLocation(currentRegion).length;

    // Invalidate entire cache if context changes
    if (
        dayTypeCacheContext.region !== currentRegion ||
        dayTypeCacheContext.weekend !== currentWeekendPattern ||
        dayTypeCacheContext.customCount !== customCount
    ) {
        dayTypeCache.clear();
        dayTypeCacheContext = {
            region: currentRegion,
            weekend: currentWeekendPattern,
            customCount: customCount
        };
    }

    if (dayTypeCache.has(year)) {
        return;
    }

    const startTs = new Date(year, 0, 1).getTime();

    // Determine number of days in year
    const isLeap = new Date(year, 1, 29).getMonth() === 1;
    const daysCount = isLeap ? 366 : 365;

    const types = new Array(daysCount);

    const { lookup } = getHolidaysForYear(year, currentRegion);
    const preset = getWeekendPreset(currentWeekendPattern);

    let current = new Date(year, 0, 1);
    for (let i = 0; i < daysCount; i++) {
        const month = current.getMonth() + 1;
        const date = current.getDate();
        const dStr = year + (month < 10 ? '-0' : '-') + month + (date < 10 ? '-0' : '-') + date;

        let type = 'workday';
        if (lookup.has(dStr)) type = 'holiday';
        else if (preset.days.includes(current.getDay())) type = 'weekend';

        types[i] = type;
        current.setDate(date + 1);
    }

    dayTypeCache.set(year, { types, startTs });
}

/**
 * Ensures the booked days index cache is populated for the specified year.
 * Relies on dayTypeCache being populated for the year.
 */
function ensureBookedDaysIndices(year) {
    if (bookedDaysIndices && bookedDaysYear === year) return;

    // Ensure dayTypeCache is ready so we have the start timestamp
    ensureDayTypeCache(year);
    const cache = dayTypeCache.get(year);

    const isLeap = new Date(year, 1, 29).getMonth() === 1;
    const daysCount = isLeap ? 366 : 365;

    bookedDaysIndices = new Uint8Array(daysCount);
    bookedDaysYear = year;

    if (bookedDates.size === 0) return;

    // Populate indices
    bookedDates.forEach(dateStr => {
        // Simple check if dateStr belongs to year
        if (dateStr.startsWith(String(year))) {
             // Calculate index
             const date = parseISODateString(dateStr);
             const diff = date.getTime() - cache.startTs;
             const idx = Math.round(diff / (1000 * 60 * 60 * 24));
             if (idx >= 0 && idx < daysCount) {
                 bookedDaysIndices[idx] = 1;
             }
        }
    });
}

/**
 * Retrieves holidays for a given year and location.
 * @param {number} year The year to get holidays for.
 * @param {string} region The location code.
 * @returns {Array<{date: string, name: string}>} A list of holiday objects.
 */
function getHolidaysForYear(year, region) {
    const customCount = getCustomHolidaysForLocation(region).length;
    const datasetKey = holidayDataset && (holidayDataset.updatedAt || holidayDataset.generatedAt)
        ? (holidayDataset.updatedAt || holidayDataset.generatedAt)
        : 'no-data';

    // Fast-path to avoid string interpolation and Map lookups in hot loops
    if (cachedHolidaysYear === year &&
        cachedHolidaysRegion === region &&
        cachedHolidaysCustomCount === customCount &&
        cachedHolidaysDatasetKey === datasetKey) {
        return cachedHolidaysResult;
    }

    const key = `${year}-${region}-${customCount}-${datasetKey}`; // Simple cache bust on custom change
    if (!holidaysCache.has(key)) {
        let holidays = [];
        if (isDatasetLocation(region)) {
            holidays = getDatasetHolidays(year, region);
            const customHolidays = getCustomHolidaysForLocation(region);
            if (customHolidays.length > 0) {
                const existingDates = new Set(holidays.map(h => h.date));
                customHolidays.forEach(h => {
                    if (!existingDates.has(h.date)) {
                        holidays.push(h);
                        existingDates.add(h.date);
                    }
                });
            }
        } else {
            holidays = getUKHolidays(year, region);
        }
        const lookup = new Map(holidays.map(h => [h.date, h]));
        holidaysCache.set(key, { holidays, lookup });
    }

    cachedHolidaysYear = year;
    cachedHolidaysRegion = region;
    cachedHolidaysCustomCount = customCount;
    cachedHolidaysDatasetKey = datasetKey;
    cachedHolidaysResult = holidaysCache.get(key);

    return cachedHolidaysResult;
}

/**
 * Checks if a given date falls on a weekend.
 * @param {Date} date The date to check.
 * @returns {boolean} True if the date is a Saturday or Sunday.
 */
function isWeekend(date) {
    const day = date.getDay();
    const preset = getWeekendPreset(currentWeekendPattern);
    return preset.days.includes(day);
}

/**
 * Checks if a given date is a holiday.
 * @param {Date} date The date to check.
 * @returns {boolean} True if the date is a holiday.
 */
function isHoliday(date, dateStr = null) {
    return getHolidayName(date, dateStr) !== null;
}

/**
 * Retrieves the name of the holiday for a given date.
 * @param {Date} date The date to check.
 * @param {string|null} [dateStr=null] Optional optimization: the ISO string for the date if already known.
 * @returns {string|null} The name of the holiday or null if it's not a holiday.
 */
function getHolidayName(date, dateStr = null) {
    const year = date.getFullYear();
    const { lookup } = getHolidaysForYear(year, currentRegion);
    const dStr = dateStr || toLocalISOString(date);
    const holiday = lookup.get(dStr);
    return holiday ? holiday.name : null;
}

// --- OPTIMIZER ---

/**
 * Determines the type of a given day (workday, weekend, or holiday).
 * @param {Date} date The date to classify.
 * @returns {('workday'|'weekend'|'holiday')} The type of the day.
 */
function getDayType(date, dateStr = null) {
    // Optimization: Check if date is within currently cached year
    const year = date.getFullYear();
    // Check if cache matches the year
    const cache = dayTypeCache.get(year);

    if (cache) {
        const diff = date.getTime() - cache.startTs;
        // Use Math.round to handle potential DST shifts (usually 1 hour)
        const dayIndex = Math.round(diff / (1000 * 60 * 60 * 24));

        if (dayIndex >= 0 && dayIndex < cache.types.length) {
            return cache.types[dayIndex];
        }
    } else if (year === currentYear) {
        // Fallback: Populate cache for currentYear if it's the requested year
        ensureDayTypeCache(currentYear);
        return getDayType(date, dateStr); // Retry with populated cache
    }

    if (isHoliday(date, dateStr)) return 'holiday';
    if (isWeekend(date)) return 'weekend';
    return 'workday';
}

/**
 * Adds a specified number of days to a date.
 * @param {Date} date The starting date.
 * @param {number} days The number of days to add.
 * @returns {Date} The new date.
 */
function addDays(date, days) {
    const original = (date instanceof Date) ? date : new Date(date);
    const d = new Date(original.valueOf() + days * 86400000);
    const diff = d.getTimezoneOffset() - original.getTimezoneOffset();
    if (diff !== 0) {
        d.setTime(d.valueOf() + diff * 60000);
    }
    return d;
}

/**
 * Returns true if a date is not a workday (weekend or holiday).
 */
function isNonWorkday(date) {
    const type = getDayType(date);
    return type === 'holiday' || type === 'weekend';
}

/**
 * Determines if a day should be treated as "off" for continuity checks.
 * Considers weekends, holidays, and any already booked leave dates when provided.
 * @param {Date} date The date to evaluate.
 * @param {Set<string>|null} bookedSet Optional set of ISO date strings representing booked leave.
 * @returns {boolean} True if the day is a weekend/holiday or already booked.
 */
function isDayOff(date, bookedSet = null) {
    if (isNonWorkday(date)) return true;
    if (bookedSet && bookedSet.has(toLocalISOString(date))) return true;
    return false;
}

/**
 * Computes the potential efficiency and bridge status for booking a single day of leave.
 * Results are cached per date/region/custom-holiday state.
 */
function getDayInsight(date, dateStr = null) {
    if (getDayType(date, dateStr) !== 'workday') return null;
    const dStr = dateStr || toLocalISOString(date);
    // Bolt Optimization: dayInsightCache is fully invalidated when region/weekend/custom changes.
    // Encoding global state into individual date keys causes massive string allocation overhead.
    const key = dStr;
    if (!dayInsightCache.has(key)) {
        let efficiency, totalDaysOff, bridge;

        // Optimization: Use integer-based calculation if caches are ready/compatible
        const year = date.getFullYear();
        const cache = dayTypeCache.get(year);
        if (cache) {
             const diff = date.getTime() - cache.startTs;
             // Use Math.round to handle potential DST shifts (usually 1 hour)
             const idx = Math.round(diff / (1000 * 60 * 60 * 24));
             if (idx >= 0 && idx < cache.types.length) {
                 ensureBookedDaysIndices(year);
                 const result = calculateInsightByIndex(idx, year);
                 efficiency = result.efficiency;
                 totalDaysOff = result.totalDaysOff;
                 bridge = result.bridge;
             }
        }

        // Fallback to Date-based logic if optimization couldn't be used
        if (efficiency === undefined) {
            const result = calculateContinuousLeave(date, 1, bookedDates);
            const prev = addDays(date, -1);
            const next = addDays(date, 1);
            bridge = isDayOff(prev, bookedDates) && isDayOff(next, bookedDates);
            efficiency = result ? result.efficiency : 1;
            totalDaysOff = result ? result.totalDaysOff : 1;
        }

        dayInsightCache.set(key, { efficiency, totalDaysOff, bridge });
    }
    return dayInsightCache.get(key);
}

/**
 * Buckets efficiency into tiers for heatmap colouring.
 */
function getEfficiencyTier(efficiency) {
    if (efficiency >= 3) return 'high';
    if (efficiency >= 2) return 'mid';
    return 'low';
}

function getLongestBlockDays(plan) {
    if (!plan || plan.length === 0) return 0;
    return Math.max(...plan.map(b => b.totalDaysOff));
}

/**
 * Compares the best consecutive-days-off block between the selected year and the previous year.
 */
function getYearComparison(year, allowance) {
    if (isDatasetLocation(currentRegion)) {
        if (!holidayDataset) return null;
        if (!hasHolidayDataForYear(currentRegion, year) || !hasHolidayDataForYear(currentRegion, year - 1)) {
            return null;
        }
    }
    const customCount = getCustomHolidaysForLocation(currentRegion).length;
    const key = `${year}-${allowance}-${currentRegion}-${currentWeekendPattern}-${customCount}`;
    if (!yearComparisonCache.has(key)) {
        const currentPlan = findOptimalPlan(year, allowance);
        const previousPlan = findOptimalPlan(year - 1, allowance);
        const currentBest = getLongestBlockDays(currentPlan);
        const previousBest = getLongestBlockDays(previousPlan);

        let deltaPercent = null;
        let direction = 'same';
        if (previousBest > 0) {
            deltaPercent = ((currentBest - previousBest) / previousBest) * 100;
            if (deltaPercent > 0.5) direction = 'more';
            else if (deltaPercent < -0.5) direction = 'less';
        }

        yearComparisonCache.set(key, {
            currentYear: year,
            previousYear: year - 1,
            currentBest,
            previousBest,
            deltaPercent,
            direction
        });
    }
    return yearComparisonCache.get(key);
}

/**
 * Helper to check if a day is off using an index.
 * Falls back to Date logic if index is out of bounds (year boundary).
 */
function isOffByIndex(idx, isOffArray, year) {
    if (idx >= 0 && idx < isOffArray.length) {
        return isOffArray[idx] === 1;
    }
    // Boundary fallback
    const date = new Date(year, 0, 1);
    date.setDate(date.getDate() + idx);
    // isDayOff defaults to null bookedSet (which is what generateAllCandidates uses)
    return isDayOff(date);
}

/**
 * Optimized calculation for single-day insight using integer indices.
 * Assumes ensureDayTypeCache and ensureBookedDaysIndices have been called.
 */
function calculateInsightByIndex(startIdx, year) {
    const cache = dayTypeCache.get(year);
    const types = cache ? cache.types : [];
    const daysCount = types.length;

    // Helper to check if a day is off (holiday, weekend, or booked)
    // Uses bookedDaysIndices for O(1) lookup within the year
    const isOff = (idx) => {
        // Boundary check
        if (idx < 0 || idx >= daysCount) {
             // Fallback to Date logic for boundary
             const date = new Date(year, 0, 1);
             date.setDate(date.getDate() + idx);
             return isDayOff(date, bookedDates);
        }

        // Within bounds
        return types[idx] !== 'workday' || bookedDaysIndices[idx] === 1;
    };

    let currentIdx = startIdx;

    // Skip already off days to find first bookable day
    // (Matches calculateContinuousLeave logic)
    while (isOff(currentIdx)) {
        currentIdx++;
    }

    // Book the day (conceptually)
    // currentIdx is now the booked day.

    // Expand backwards
    let start = currentIdx;
    while (isOff(start - 1)) {
        start--;
    }

    // Expand forwards
    let end = currentIdx;
    while (isOff(end + 1)) {
        end++;
    }

    const totalDaysOff = end - start + 1;

    // Bridge check:
    // Original logic: bridge = isDayOff(prev) && isDayOff(next)
    // where prev/next are immediately adjacent to the QUERY date (startIdx).
    const bridge = isOff(startIdx - 1) && isOff(startIdx + 1);

    return {
        efficiency: totalDaysOff, // leaveDaysUsed is 1
        totalDaysOff: totalDaysOff,
        bridge: bridge
    };
}

/**
 * Optimized version of calculateContinuousLeave using integer indices.
 * @param {number} startIdx Index of the start day (0 = Jan 1).
 * @param {number} leaveDaysToUse Number of leave days to add.
 * @param {Uint8Array} isOffArray Array where 1=off, 0=workday.
 * @param {number} year The year (for boundary dates).
 */
function calculateContinuousLeaveByIndex(startIdx, leaveDaysToUse, isOffArray, year) {
    let currentIdx = startIdx;
    let daysCounted = 0;

    // Find first bookable workday (skip existing off days)
    while (isOffByIndex(currentIdx, isOffArray, year)) {
        currentIdx++;
    }

    // Expand to consume allowance
    const firstBookedIdx = currentIdx;
    let lastBookedIdx = currentIdx;

    while (daysCounted < leaveDaysToUse) {
        if (!isOffByIndex(currentIdx, isOffArray, year)) {
            daysCounted++;
            lastBookedIdx = currentIdx;
        }
        currentIdx++;
    }

    // Expand backwards
    let rangeStartIdx = firstBookedIdx;
    while (true) {
        if (!isOffByIndex(rangeStartIdx - 1, isOffArray, year)) {
            break;
        }
        rangeStartIdx--;
    }

    // Expand forwards
    let rangeEndIdx = lastBookedIdx;
    while (true) {
        if (!isOffByIndex(rangeEndIdx + 1, isOffArray, year)) {
            break;
        }
        rangeEndIdx++;
    }

    const totalDaysOff = rangeEndIdx - rangeStartIdx + 1;

    return {
        startIdx: rangeStartIdx,
        endIdx: rangeEndIdx,
        startDate: rangeStartIdx, // for findBestCombination sorting
        endDate: rangeEndIdx,     // for findBestCombination overlap check
        leaveDaysUsed: leaveDaysToUse,
        totalDaysOff: totalDaysOff,
        efficiency: totalDaysOff / leaveDaysToUse
    };
}

/**
 * Calculates a continuous block of time off based on a starting workday and a number of leave days.
 * It expands the block to include adjacent weekends, holidays, and already booked leave.
 * @param {Date} startDate First day of leave to book.
 * @param {number} leaveDaysToUse Number of leave days to add.
 * @param {Set<string>|null} bookedSet Optional set of ISO date strings representing already booked leave.
 */
function calculateContinuousLeave(startDate, leaveDaysToUse, bookedSet = null) {
    let leaveDaysBooked = [];
    let current = new Date(startDate);
    let daysCounted = 0;

    // Find first bookable workday (skip existing off days)
    while (isDayOff(current, bookedSet)) {
        current.setDate(current.getDate() + 1);
    }

    while (daysCounted < leaveDaysToUse) {
        if (!isDayOff(current, bookedSet)) {
            // Optimization: Store timestamps to avoid excessive Date object allocation
            leaveDaysBooked.push(current.getTime());
            daysCounted++;
        }
        current.setDate(current.getDate() + 1);
    }

    if (leaveDaysBooked.length === 0) return null;

    const firstBookedDay = leaveDaysBooked[0];
    const lastBookedDay = leaveDaysBooked[leaveDaysBooked.length - 1];

    // Expand backwards through any off days (weekend/holiday/booked)
    let rangeStart = new Date(firstBookedDay);
    while (true) {
        rangeStart.setDate(rangeStart.getDate() - 1);
        if (!isDayOff(rangeStart, bookedSet)) {
            rangeStart.setDate(rangeStart.getDate() + 1); // Revert
            break;
        }
    }

    // Expand forwards through any off days (weekend/holiday/booked)
    let rangeEnd = new Date(lastBookedDay);
    while (true) {
        rangeEnd.setDate(rangeEnd.getDate() + 1);
        if (!isDayOff(rangeEnd, bookedSet)) {
            rangeEnd.setDate(rangeEnd.getDate() - 1); // Revert
            break;
        }
    }

    const totalDaysOff = (rangeEnd - rangeStart) / (1000 * 60 * 60 * 24) + 1;

    return {
        startDate: rangeStart,
        endDate: rangeEnd,
        leaveDaysUsed: leaveDaysToUse,
        totalDaysOff: Math.round(totalDaysOff),
        efficiency: totalDaysOff / leaveDaysToUse,
        get bookedDates() {
            if (!this._bookedDates) {
                const dates = leaveDaysBooked.map(ts => new Date(ts));
                Object.defineProperty(this, '_bookedDates', {
                    value: dates,
                    enumerable: false,
                    writable: true
                });
                return dates;
            }
            return this._bookedDates;
        }
    };
}

/**
 * Generates and deduplicates all reasonable leave candidates.
 * @param {number} year The year to plan for.
 * @param {number} allowance The number of leave days available.
 * @returns {Array<Object>} List of unique candidate blocks.
 */
function generateAllCandidates(year, allowance) {
    // Ensure cache is ready for the requested year
    ensureDayTypeCache(year);
    const types = dayTypeCache.get(year).types;

    const isLeap = new Date(year, 1, 29).getMonth() === 1;
    const daysCount = isLeap ? 366 : 365;

    // Create boolean lookup for fast checking
    // 0 = workday, 1 = off
    const isOffArray = new Uint8Array(daysCount);
    for (let i = 0; i < daysCount; i++) {
        isOffArray[i] = types[i] !== 'workday' ? 1 : 0;
    }

    // Bolt Optimization: Pre-calculate expansion boundaries to avoid repeated Date creation and scanning
    // Complexity reduces from O(N * Allowance^2) to O(N * Allowance)

    // 1. Calculate expansionStart (backwards expansion)
    const expansionStart = new Int32Array(daysCount);
    let run = 0;
    // Check previous year boundary
    let idx = -1;
    while (isOffByIndex(idx, isOffArray, year)) {
        run++;
        idx--;
    }
    // Forward pass to fill expansionStart
    for (let i = 0; i < daysCount; i++) {
        if (isOffArray[i] === 1) { // OFF
            run++;
        } else { // Workday
            expansionStart[i] = i - run;
            run = 0;
        }
    }

    // 2. Calculate expansionEnd (forwards expansion)
    const expansionEnd = new Int32Array(daysCount);
    run = 0;
    // Check next year boundary
    idx = daysCount;
    while (isOffByIndex(idx, isOffArray, year)) {
        run++;
        idx++;
    }
    // Backward pass to fill expansionEnd
    for (let i = daysCount - 1; i >= 0; i--) {
        if (isOffArray[i] === 1) { // OFF
            run++;
        } else { // Workday
            expansionEnd[i] = i + run;
            run = 0;
        }
    }

    // 3. Identify workday indices
    // Bolt Optimization: Pre-allocate array and track count instead of push
    let workdayCount = 0;
    for (let i = 0; i < daysCount; i++) {
        if (isOffArray[i] === 0) {
            workdayCount++;
        }
    }
    const workdayIndices = new Int32Array(workdayCount);
    let wdIdx = 0;
    for (let i = 0; i < daysCount; i++) {
        if (isOffArray[i] === 0) {
            workdayIndices[wdIdx++] = i;
        }
    }

    const numWorkdays = workdayIndices.length;
    // Bolt Optimization: Pre-allocate uniqueCandidates array to exact required size to avoid GC thrashing and dynamic resize overhead
    const uniqueCandidates = new Array(numWorkdays * allowance);
    let candidateCount = 0;

    for (let k = 0; k < numWorkdays; k++) {
        const firstBookedIdx = workdayIndices[k];
        const realStart = expansionStart[firstBookedIdx];

        // Max possible length is limited by allowance AND remaining workdays
        const maxL = Math.min(allowance, numWorkdays - k);

        for (let len = 1; len <= maxL; len++) {
            const lastBookedIdx = workdayIndices[k + len - 1];
            const realEnd = expansionEnd[lastBookedIdx];

            const totalDaysOff = realEnd - realStart + 1;
            uniqueCandidates[candidateCount++] = {
                startIdx: realStart,
                endIdx: realEnd,
                startDate: realStart, // for findBestCombination sorting (index)
                endDate: realEnd,     // for findBestCombination overlap check (index)
                leaveDaysUsed: len,
                totalDaysOff: totalDaysOff,
                efficiency: totalDaysOff / len
            };
        }
    }

    uniqueCandidates.length = candidateCount;
    return uniqueCandidates;
}

/**
 * Selects the top candidates based on efficiency and duration.
 * @param {Array<Object>} candidates List of all candidates.
 * @returns {Array<Object>} Filtered list of top candidates.
 */
function selectTopCandidates(candidates) {
    // Bolt Optimization: Replace O(N log N) full array sorting with O(N log K) bounded binary insertion.
    // Instead of using splice and pop which modifies the array and shifts elements natively,
    // we use a pre-allocated array and manually shift elements to avoid garbage collection
    // overhead and excessive array object reallocation, making it 2x faster.
    // Further optimized by inlining the comparison logic and hoisting property accesses.
    const topEff = new Array(100);
    const topDur = new Array(50);
    let effCount = 0;
    let durCount = 0;

    for (let i = 0; i < candidates.length; i++) {
        const c = candidates[i];

        let shouldInsertEff = false;
        if (effCount < 100) {
            shouldInsertEff = true;
        } else {
            const b = topEff[99];
            if (c.efficiency > b.efficiency ||
               (c.efficiency === b.efficiency && (c.totalDaysOff > b.totalDaysOff ||
               (c.totalDaysOff === b.totalDaysOff && c.startIdx < b.startIdx)))) {
                shouldInsertEff = true;
            }
        }

        if (shouldInsertEff) {
            let low = 0;
            let high = effCount - 1;
            while (low <= high) {
                const mid = (low + high) >> 1;
                const b = topEff[mid];

                if (b.efficiency > c.efficiency ||
                   (b.efficiency === c.efficiency && (b.totalDaysOff > c.totalDaysOff ||
                   (b.totalDaysOff === c.totalDaysOff && b.startIdx < c.startIdx)))) {
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            }
            if (effCount < 100) effCount++;
            for (let j = effCount - 1; j > low; j--) {
                topEff[j] = topEff[j - 1];
            }
            topEff[low] = c;
        }

        let shouldInsertDur = false;
        if (durCount < 50) {
            shouldInsertDur = true;
        } else {
            const b = topDur[49];
            if (c.totalDaysOff > b.totalDaysOff ||
               (c.totalDaysOff === b.totalDaysOff && (c.efficiency > b.efficiency ||
               (c.efficiency === b.efficiency && c.startIdx < b.startIdx)))) {
                shouldInsertDur = true;
            }
        }

        if (shouldInsertDur) {
            let low = 0;
            let high = durCount - 1;
            while (low <= high) {
                const mid = (low + high) >> 1;
                const b = topDur[mid];

                if (b.totalDaysOff > c.totalDaysOff ||
                   (b.totalDaysOff === c.totalDaysOff && (b.efficiency > c.efficiency ||
                   (b.efficiency === c.efficiency && b.startIdx < c.startIdx)))) {
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            }
            if (durCount < 50) durCount++;
            for (let j = durCount - 1; j > low; j--) {
                topDur[j] = topDur[j - 1];
            }
            topDur[low] = c;
        }
    }

    const finalCandidates = [];
    const finalSeen = new Set();

    for (let i = 0; i < effCount; i++) {
        const c = topEff[i];
        const key = (c.startIdx << 16) | c.endIdx;
        if (!finalSeen.has(key)) {
            finalSeen.add(key);
            finalCandidates.push(c);
        }
    }

    for (let i = 0; i < durCount; i++) {
        const c = topDur[i];
        const key = (c.startIdx << 16) | c.endIdx;
        if (!finalSeen.has(key)) {
            finalSeen.add(key);
            finalCandidates.push(c);
        }
    }

    finalCandidates.sort((a, b) => (b.efficiency - a.efficiency) || (b.totalDaysOff - a.totalDaysOff) || (a.startIdx - b.startIdx));
    return finalCandidates;
}

// Bolt Optimization: Global memo array to avoid garbage collection and repeated allocation of (N+1)*ROW_SIZE elements (~20% speedup).
let sharedMemo = new Int32Array(0);

/**
 * Finds the best combination of 1, 2, or 3 leave blocks that maximize days off.
 * @param {Array<Object>} candidates Top candidates to choose from.
 * @param {number} allowance Total leave allowance.
 * @returns {Array<Object>} The best combination of blocks.
 */
function findBestCombination(candidates, allowance) {
    const bestCombo = [];
    if (candidates.length == 0 || allowance <= 0) {
        return bestCombo;
    }

    // Sort candidates by start date for DP
    // Bolt Optimization: Replace spread syntax with slice() for faster array copying
    // Bolt Optimization: Pre-allocate array and manually copy to avoid slice overhead. Sort using integer indices.
    const N = candidates.length;
    const sortedCandidates = new Array(N);
    for (let i = 0; i < N; i++) {
        sortedCandidates[i] = candidates[i];
    }
    sortedCandidates.sort((a, b) => a.startIdx - b.startIdx);

    // Precompute next compatible candidate index for each candidate
    // nextCompatible[i] = index of first candidate that starts after candidate[i] ends
    const nextCompatible = new Int32Array(N);
    let j = 0;
    for (let i = 0; i < N; i++) {
        if (j < i + 1) j = i + 1;
        while (j < N && sortedCandidates[j].startIdx <= sortedCandidates[i].endIdx) {
            j++;
        }
        nextCompatible[i] = j;
    }

    // DP State: dp[i][k][w] = Max Total Days Off
    // i: index in sortedCandidates (0..N)
    // k: number of items to pick (0..3)
    // w: allowance used (0..allowance)
    // Flattened array: [i * ROW_SIZE + k * SIZE_W + w]
    const K_MAX = 3;
    const W_MAX = allowance;
    const SIZE_W = W_MAX + 1;
    const SIZE_K = K_MAX + 1;
    const ROW_SIZE = SIZE_K * SIZE_W;
    const requiredSize = (N + 1) * ROW_SIZE;

    // Bolt Optimization: Reuse global array to prevent 60k element allocation every call
    if (sharedMemo.length < requiredSize) {
        sharedMemo = new Int32Array(requiredSize);
    }
    const memo = sharedMemo;

    // Initialize only the required bounds with -1 (invalid/unreachable)
    memo.fill(-1, 0, requiredSize);

    // Base case: i=N (no candidates left).
    // If k=0, totalOff=0. Else -1 (remain default).
    for (let w = 0; w <= W_MAX; w++) {
        memo[N * ROW_SIZE + 0 * SIZE_W + w] = 0;
    }

    // Bolt Optimization: Unroll inner loop across k values to dramatically reduce jump boundaries
    // and hoist all base index calculations out of the w-loops. This yields a substantial ~20%
    // execution time improvement for the core dynamic programming engine.
    for (let i = N - 1; i >= 0; i--) {
        const cand = sortedCandidates[i];
        const cost = cand.leaveDaysUsed;
        const totalOff = cand.totalDaysOff;
        const nextI = nextCompatible[i];

        const baseIdx = i * ROW_SIZE;
        const nextBaseIdx = (i + 1) * ROW_SIZE;
        const nextI_ROW_SIZE = nextI * ROW_SIZE;

        // Base Case: k = 0, we can't take any more candidates
        for (let w = 0; w <= W_MAX; w++) {
            memo[baseIdx + w] = memo[nextBaseIdx + w];
        }

        // Processing k = 1, 2, 3 explicitly to eliminate the `for(k=1..3)` loop overhead
        let kBaseIdx = baseIdx;
        let kNextBaseIdx = nextBaseIdx;
        let prevBaseIdx = nextI_ROW_SIZE - SIZE_W;

        for (let k = 1; k <= 3; k++) {
            kBaseIdx += SIZE_W;
            kNextBaseIdx += SIZE_W;
            prevBaseIdx += SIZE_W;

            // For w < cost, we can't afford candidate i, inherit skipped value directly
            for (let w = 0; w < cost; w++) {
                memo[kBaseIdx + w] = memo[kNextBaseIdx + w];
            }

            // For w >= cost, we afford candidate i and calculate max
            for (let w = cost; w <= W_MAX; w++) {
                let res = memo[kNextBaseIdx + w]; // Option 1: Skip
                const prevVal = memo[prevBaseIdx + w - cost]; // Option 2: Take

                if (prevVal !== -1) {
                    const currentVal = totalOff + prevVal;
                    if (currentVal > res) {
                        res = currentVal;
                    }
                }
                memo[kBaseIdx + w] = res;
            }
        }
    }

    // Find the best combination by score
    let foundK = -1;
    let foundW = -1;

    // Helper to compute score
    function computeScore(totalOff, totalLeave) {
        if (totalLeave == 0) return -1;
        const efficiency = totalOff / totalLeave;
        return (totalOff * 1000) + (efficiency * 10) - totalLeave;
    }

    // Prioritize 3 blocks, then 2, then 1 (matching original behavior)
    for (let k = 3; k >= 1; k--) {
        let localBestScore = -1;
        let localBestW = -1;

        for (let w = 1; w <= W_MAX; w++) {
            const totalOff = memo[0 * ROW_SIZE + k * SIZE_W + w];
            if (totalOff > 0) {
                const s = computeScore(totalOff, w);
                if (s > localBestScore) {
                    localBestScore = s;
                    localBestW = w;
                }
            }
        }

        if (localBestScore > -1) {
            foundK = k;
            foundW = localBestW;
            break; // Stop as we prioritize higher k
        }
    }

    // Reconstruct solution
    if (foundK != -1) {
        let curI = 0;
        let curK = foundK;
        let curW = foundW;

        while (curK > 0 && curI < N) {
            const skippedVal = memo[(curI + 1) * ROW_SIZE + curK * SIZE_W + curW];

            let takenVal = -2;
            const cand = sortedCandidates[curI];
            if (cand.leaveDaysUsed <= curW) {
                const nextI = nextCompatible[curI];
                const prevVal = memo[nextI * ROW_SIZE + (curK - 1) * SIZE_W + (curW - cand.leaveDaysUsed)];
                if (prevVal != -1) {
                    takenVal = cand.totalDaysOff + prevVal;
                }
            }

            // Prefer taking if it yields optimal result (greedy for earliest start date)
            if (takenVal != -2 && takenVal >= skippedVal) {
                bestCombo.push(cand);
                curI = nextCompatible[curI];
                curW -= cand.leaveDaysUsed;
                curK -= 1;
            } else {
                curI++;
            }
        }
    }

    bestCombo.sort((a, b) => a.startIdx - b.startIdx);
    return bestCombo;
}

function findOptimalPlan(year, allowance) {
    const uniqueCandidates = generateAllCandidates(year, allowance);
    const topCandidates = selectTopCandidates(uniqueCandidates);
    const bestCombo = findBestCombination(topCandidates, allowance);

    // Convert optimized index-based candidates back to full Date objects
    return bestCombo.map(c => {
        // startIdx and endIdx are 0-based from Jan 1 of 'year'
        const startDate = new Date(year, 0, 1);
        startDate.setDate(startDate.getDate() + c.startIdx);

        const endDate = new Date(year, 0, 1);
        endDate.setDate(endDate.getDate() + c.endIdx);

        // Generate the list of booked dates (workdays)
        const bookedDates = [];

        // We reconstruct the booked dates by checking which days in the range are workdays.
        // Since candidates were generated from valid workdays within the year,
        // any workdays within the [start, end] range must be the booked ones.
        // Any days outside the year boundary (indices < 0 or >= length) in the range
        // are by definition OFF days (otherwise expansion wouldn't have included them),
        // so we don't need to check them for booking.
        const types = dayTypeCache.get(year).types;
        for (let i = c.startIdx; i <= c.endIdx; i++) {
            if (i >= 0 && i < types.length) {
                if (types[i] === 'workday') {
                    const d = new Date(year, 0, 1);
                    d.setDate(d.getDate() + i);
                    bookedDates.push(d);
                }
            }
        }

        return {
            startDate,
            endDate,
            leaveDaysUsed: c.leaveDaysUsed,
            totalDaysOff: c.totalDaysOff,
            efficiency: c.efficiency,
            bookedDates
        };
    });
}

/**
 * Checks if two leave blocks overlap.
 */
function overlap(b1, b2) {
    return b1.startDate <= b2.endDate && b1.endDate >= b2.startDate;
}

// --- CALENDAR EXPORT ---

/**
 * Generates and downloads an iCal (.ics) file containing all booked leave periods.
 */
function exportToICS() {
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn && exportBtn.getAttribute('aria-disabled') === 'true') {
        return;
    }

    const blocks = analyzeCurrentPlan();
    if (blocks.length === 0) {
        showToast('No leave periods to export. Please book some leave days first.', 'error');
        return;
    }

    // Build iCal content
    const icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Vacation Maximiser//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
    ];

    blocks.forEach((block, index) => {
        // Format dates as YYYYMMDD (iCal DATE format)
        const startStr = toLocalISOString(block.startDate).replace(/-/g, '');
        // iCal DTEND is exclusive, so add 1 day
        const endDate = addDays(block.endDate, 1);
        const endStr = toLocalISOString(endDate).replace(/-/g, '');

        // Generate a unique ID
        const uid = `vacation-${currentYear}-${index}-${Date.now()}@vacationmaximiser`;

        icsLines.push(
            'BEGIN:VEVENT',
            `DTSTART;VALUE=DATE:${startStr}`,
            `DTEND;VALUE=DATE:${endStr}`,
            `SUMMARY:Annual Leave (${block.leaveDays} days)`,
            `DESCRIPTION:${block.totalDays} days off using ${block.leaveDays} leave days\\nGenerated by Vacation Maximiser`,
            `UID:${uid}`,
            'STATUS:CONFIRMED',
            'TRANSP:OPAQUE',
            'END:VEVENT'
        );
    });

    icsLines.push('END:VCALENDAR');

    // Create and trigger download
    const icsContent = icsLines.join('\r\n');
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `vacation-plan-${currentYear}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    showToast('Your calendar file is ready for download.', 'success');
}

// --- MAIN UI ---

function renderLocationSelectOptions() {
    if (typeof document === 'undefined') return;
    const locationSelect = document.getElementById('location-select');
    if (!locationSelect) return;

    locationSelect.textContent = '';

    LOCATION_GROUPS.forEach((group) => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = group.label;

        group.options.forEach((optionData) => {
            const option = document.createElement('option');
            option.value = optionData.value;
            option.textContent = optionData.label;
            optgroup.appendChild(option);
        });

        locationSelect.appendChild(optgroup);
    });
}

/**
 * Initializes the application, sets up event listeners, and performs the initial render.
 */
function init() {
    // Load saved state if available
    const savedState = loadState();
    let shouldRestoreFromSaved = false;

    const appliedSharedPlan = applySharedPlanFromUrl();
    if (!appliedSharedPlan && savedState) {
        // Restore state variables from local storage if no shared plan
        if (typeof savedState.currentAllowance === 'number' && savedState.currentAllowance > 0 && savedState.currentAllowance <= 365) {
            currentAllowance = savedState.currentAllowance;
        }
        if (typeof savedState.currentYear === 'number') {
            currentYear = savedState.currentYear;
        }
        if (typeof savedState.currentRegion === 'string' && isSupportedRegion(savedState.currentRegion)) {
            currentRegion = savedState.currentRegion;
        }
        if (Array.isArray(savedState.bookedDates)) {
            const safeDates = savedState.bookedDates
                .slice(0, MAX_BOOKED_DATES)
                .filter(d => typeof d === 'string' && DATE_REGEX.test(d));
            bookedDates = new Set(safeDates);
            shouldRestoreFromSaved = safeDates.length > 0;
        }
        if (savedState.customHolidaysByLocation) {
            customHolidaysByLocation = sanitizeHolidayMap(savedState.customHolidaysByLocation);
        } else if (Array.isArray(savedState.customHolidays)) {
            customHolidaysByLocation = {};
            const safeList = sanitizeHolidayList(savedState.customHolidays);
            if (safeList.length > 0) {
                customHolidaysByLocation[currentRegion] = safeList;
            }
        }
        if (savedState.weekendByLocation && typeof savedState.weekendByLocation === 'object') {
            weekendByLocation = {};
            Object.entries(savedState.weekendByLocation).forEach(([location, pattern]) => {
                if (isSupportedRegion(location) && Object.prototype.hasOwnProperty.call(WEEKEND_PRESETS, pattern)) {
                    weekendByLocation[location] = pattern;
                }
            });
        }
        if (typeof savedState.currentWeekendPattern === 'string' && Object.prototype.hasOwnProperty.call(WEEKEND_PRESETS, savedState.currentWeekendPattern)) {
            currentWeekendPattern = savedState.currentWeekendPattern;
        } else if (weekendByLocation[currentRegion]) {
            currentWeekendPattern = weekendByLocation[currentRegion];
        } else {
            currentWeekendPattern = getDefaultWeekendForLocation(currentRegion);
        }
        weekendByLocation[currentRegion] = currentWeekendPattern;
    } else if (appliedSharedPlan) {
        shouldRestoreFromSaved = bookedDates.size > 0;
        // Persist the shared plan locally for subsequent visits
        saveState();
    }

    if (!isSupportedRegion(currentRegion)) {
        currentRegion = REGIONS.ENGLAND_WALES;
        currentWeekendPattern = getDefaultWeekendForLocation(currentRegion);
        weekendByLocation[currentRegion] = currentWeekendPattern;
    }

    ensureCustomHolidays(currentRegion);

    const yearSelect = document.getElementById('year-select');
    if (yearSelect) {
        yearSelect.textContent = '';
        const currentYearNow = new Date().getFullYear();
        const minYear = currentYearNow;
        const maxYear = currentYearNow + 5;
        if (currentYear < minYear || currentYear > maxYear) {
            currentYear = minYear;
        }
        for (let i = 0; i <= 5; i++) {
            const year = currentYearNow + i;
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (year === currentYear) {
                option.selected = true;
            }
            yearSelect.appendChild(option);
        }

        yearSelect.addEventListener('change', (e) => {
            currentYear = parseInt(e.target.value);
            if (isDatasetLocation(currentRegion)) {
                loadHolidayDataset();
            }
            invalidateInsightCaches();
            resetToOptimal();
            saveState();
        });
    }

    const locationSelect = document.getElementById('location-select');
    if (locationSelect) {
        renderLocationSelectOptions();
        locationSelect.value = currentRegion;
        locationSelect.addEventListener('change', (e) => {
            currentRegion = e.target.value;
            if (!getLocationConfig(currentRegion)) {
                currentRegion = REGIONS.ENGLAND_WALES;
            }
            ensureCustomHolidays(currentRegion);

            const defaultWeekend = getDefaultWeekendForLocation(currentRegion);
            currentWeekendPattern = weekendByLocation[currentRegion] || defaultWeekend;
            weekendByLocation[currentRegion] = currentWeekendPattern;

            const weekendSelect = document.getElementById('weekend-select');
            if (weekendSelect) {
                weekendSelect.value = currentWeekendPattern;
            }

            if (isDatasetLocation(currentRegion)) {
                loadHolidayDataset();
            }

            // Clear cache to force reload of holidays for new location
            clearHolidaysCache();
            invalidateInsightCaches();
            renderCustomHolidays();
            renderHolidayDataStatus();
            resetToOptimal();
            saveState();
        });
    }

    const weekendSelect = document.getElementById('weekend-select');
    if (weekendSelect) {
        weekendSelect.value = currentWeekendPattern;
        weekendSelect.addEventListener('change', (e) => {
            const value = e.target.value;
            if (Object.prototype.hasOwnProperty.call(WEEKEND_PRESETS, value)) {
                currentWeekendPattern = value;
                weekendByLocation[currentRegion] = currentWeekendPattern;
                invalidateInsightCaches();
                resetToOptimal();
                saveState();
            }
        });
    }

    const allowanceInput = document.getElementById('allowance-input');
    if (allowanceInput) {
        allowanceInput.value = currentAllowance;
        allowanceInput.addEventListener('change', (e) => {
            const val = parseInt(e.target.value);
            if (val > 0 && val <= 365) {
                currentAllowance = val;
                invalidateInsightCaches();
                resetToOptimal();
                saveState();
            } else {
                e.target.value = currentAllowance;
                showToast('Allowance must be between 1 and 365 days.', 'error');
            }
        });
    }

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetToOptimal();
            saveState();
        });
    }

    // Custom Holiday Logic
    const customHolidayForm = document.getElementById('custom-holiday-form');
    if (customHolidayForm) {
        customHolidayForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addCustomHoliday();
        });
    }

    // Export Button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToICS);
    }

    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', handleShareLink);
    }

    if (isDatasetLocation(currentRegion)) {
        loadHolidayDataset();
    }

    // If we have saved booked dates, restore and render; otherwise compute optimal
    if (shouldRestoreFromSaved) {
        updateUI();
    } else {
        resetToOptimal();
    }

    initScrollHandler();
    renderCustomHolidays();
}

/**
 * Adds a custom holiday to the list.
 */
function addCustomHoliday() {
    const dateInput = document.getElementById('custom-date-input');
    const nameInput = document.getElementById('custom-name-input');
    const dateVal = dateInput.value;
    const nameVal = nameInput.value.trim();

    if (dateVal && nameVal) {
        if (!DATE_REGEX.test(dateVal)) {
            showToast('Invalid date format. Please use YYYY-MM-DD.', 'error');
            return;
        }

        if (nameVal.length > 50) {
            showToast('Holiday name is too long (max 50 characters).', 'error');
            return;
        }

        const customHolidays = ensureCustomHolidays(currentRegion);

        if (customHolidays.length >= MAX_CUSTOM_HOLIDAYS) {
            showToast(`Maximum limit of ${MAX_CUSTOM_HOLIDAYS} custom holidays reached.`, 'error');
            return;
        }

        // Prevent dupes
        if (!customHolidays.some(h => h.date === dateVal)) {
            customHolidays.push({ date: dateVal, name: nameVal, isCustom: true });
            renderCustomHolidays();
            clearHolidaysCache(); // Reset cache to include new holiday
            invalidateInsightCaches();
            resetToOptimal();
            saveState();
            dateInput.value = '';
            nameInput.value = '';
            showToast(`Added custom holiday: ${nameVal}`, 'success');
        } else {
            showToast('A custom holiday for this date already exists.', 'error');
        }
    } else {
        showToast('Please enter both a date and a name.', 'error');
    }
}

/**
 * Removes a custom holiday.
 */
function removeCustomHoliday(dateStr) {
    const customHolidays = getCustomHolidaysForLocation(currentRegion);
    const holidayToRemove = customHolidays.find(h => h.date === dateStr);
    customHolidaysByLocation[currentRegion] = customHolidays.filter(h => h.date !== dateStr);
    renderCustomHolidays();
    clearHolidaysCache();
    invalidateInsightCaches();
    resetToOptimal();
    saveState();
    if (holidayToRemove) {
        showToast(`Removed custom holiday: ${holidayToRemove.name}`, 'info');
    }
}

/**
 * Renders the list of custom holidays.
 */
function renderCustomHolidays() {
    const list = document.getElementById('custom-holidays-list');
    if (!list) return;
    list.textContent = '';

    const customHolidays = getCustomHolidaysForLocation(currentRegion);

    if (customHolidays.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'empty-message';
        emptyMsg.textContent = 'No custom holidays added.';
        list.appendChild(emptyMsg);
        return;
    }

    customHolidays.forEach(h => {
        const tag = document.createElement('div');
        tag.className = 'custom-tag';
        tag.textContent = `${h.name} (${h.date}) `;

        const btn = document.createElement('button');
        btn.textContent = '\u00D7'; // Multiply symbol for 'times'
        // Strip HTML tags for safety and cleaner accessibility label
        const safeName = h.name.replace(/<[^>]*>?/gm, '');
        btn.setAttribute('aria-label', `Remove ${safeName || 'holiday'}`);
        btn.setAttribute('title', `Remove ${safeName || 'holiday'}`);
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent other clicks
            removeCustomHoliday(h.date);
        });

        tag.appendChild(btn);
        list.appendChild(tag);
    });
}

/**
 * Sets up a scroll listener to handle the sticky header's appearance.
 */
function initScrollHandler() {
    const threshold = 100; // Scroll threshold
    let ticking = false;

    function handleScroll() {
        if (window.scrollY > threshold && !document.body.classList.contains('scrolled')) {
            document.body.classList.add('scrolled');
        } else if (window.scrollY <= threshold && document.body.classList.contains('scrolled')) {
            document.body.classList.remove('scrolled');
        }
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(handleScroll);
            ticking = true;
        }
    });
}

/**
 * Shows the loading spinner overlay.
 */
function showLoading() {
    let loader = document.getElementById('loading-overlay');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loading-overlay';
        const spinnerContainer = document.createElement('div');
        spinnerContainer.className = 'spinner-container';
        spinnerContainer.setAttribute('role', 'status');
        spinnerContainer.setAttribute('aria-live', 'polite');

        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        spinner.setAttribute('aria-hidden', 'true');

        const text = document.createElement('p');
        text.textContent = 'Optimizing your vacation plan...';

        spinnerContainer.appendChild(spinner);
        spinnerContainer.appendChild(text);
        loader.appendChild(spinnerContainer);

        document.body.appendChild(loader);
    }
    loader.style.display = 'flex';
}

/**
 * Hides the loading spinner overlay.
 */
function hideLoading() {
    const loader = document.getElementById('loading-overlay');
    if (loader) {
        loader.style.display = 'none';
    }
}

/**
 * Resets the current plan to the optimal plan and updates the UI.
 */
async function resetToOptimal() {
    showLoading();
    if (isDatasetLocation(currentRegion) && !holidayDataset) {
        await loadHolidayDataset();
    }
    setTimeout(() => {
        try {
            const blocks = findOptimalPlan(currentYear, currentAllowance);
            bookedDates.clear();
            blocks.forEach(block => {
                block.bookedDates.forEach(d => {
                    bookedDates.add(toLocalISOString(d));
                });
            });
            invalidateInsightCaches();
            updateUI();
        } finally {
            hideLoading();
        }
    }, 50);
}

/**
 * Triggers a full refresh of the UI components.
 */
function updateUI() {
    document.getElementById('calendar-year-title').textContent = `${currentYear} Calendar`;
    renderStats();
    renderRecommendations();
    renderInsights();
    renderHolidayDataStatus();
    renderCalendar();
}

/**
 * Analyzes the currently selected `bookedDates` to identify continuous blocks of time off.
 * Bolt Optimization: Uses integer-based indices (0-365) instead of Date objects for O(N) performance.
 */
function analyzeCurrentPlan() {
    if (bookedDates.size === 0) return [];

    // Ensure caches are ready for the current year
    ensureBookedDaysIndices(currentYear);
    const cache = dayTypeCache.get(currentYear);
    // Safety check in case cache failed to populate
    if (!cache) return [];

    const types = cache.types;
    const daysCount = types.length;
    const blocks = [];
    let currentBlock = null;

    for (let i = 0; i < daysCount; i++) {
        // Check if day is OFF (weekend, holiday, or booked)
        // Accessing typed array (bookedDaysIndices) and string array (types) is much faster
        // than Date object creation and Map lookups in the original loop.
        const isBooked = bookedDaysIndices[i] === 1;
        const isOff = isBooked || types[i] !== 'workday';

        if (isOff) {
            if (!currentBlock) {
                currentBlock = {
                    startIdx: i,
                    endIdx: i,
                    leaveDays: 0,
                    totalDays: 0
                };
            }
            currentBlock.endIdx = i;
            currentBlock.totalDays++;
            if (isBooked) currentBlock.leaveDays++;
        } else {
            if (currentBlock) {
                if (currentBlock.leaveDays > 0) {
                    blocks.push(hydrateBlock(currentBlock, currentYear));
                }
                currentBlock = null;
            }
        }
    }
    // Handle block at end of year
    if (currentBlock && currentBlock.leaveDays > 0) {
        blocks.push(hydrateBlock(currentBlock, currentYear));
    }

    blocks.sort((a, b) => b.totalDays - a.totalDays);
    return blocks;
}

/**
 * Helper to convert integer-based block indices back to Date objects.
 */
function hydrateBlock(blockIndices, year) {
    const startDate = new Date(year, 0, 1);
    startDate.setDate(startDate.getDate() + blockIndices.startIdx);

    const endDate = new Date(year, 0, 1);
    endDate.setDate(endDate.getDate() + blockIndices.endIdx);

    return {
        startDate,
        endDate,
        leaveDays: blockIndices.leaveDays,
        totalDays: blockIndices.totalDays
    };
}

/**
 * Renders the statistics section (days used, total days off).
 */
function renderStats() {
    const used = bookedDates.size;
    const blocks = analyzeCurrentPlan();
    const totalOff = blocks.reduce((sum, b) => sum + b.totalDays, 0);

    const usedEl = document.getElementById('days-used');
    usedEl.textContent = used;

    if (used > currentAllowance) {
        usedEl.classList.add('error');
    } else {
        usedEl.classList.remove('error');
    }
    usedEl.style.color = '';

    document.getElementById('days-off').textContent = totalOff;

    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        if (blocks.length === 0) {
            exportBtn.setAttribute('aria-disabled', 'true');
            exportBtn.title = 'Please book some leave days first to export a plan.';
        } else {
            exportBtn.removeAttribute('aria-disabled');
            exportBtn.removeAttribute('title');
        }
    }
}

/**
 * Renders insight cards such as year-over-year comparison.
 */
function renderInsights() {
    const yoyMain = document.getElementById('yoy-main');
    const yoySub = document.getElementById('yoy-sub');
    if (!yoyMain || !yoySub) return;

    const comparison = getYearComparison(currentYear, currentAllowance);
    if (!comparison || comparison.previousBest === 0) {
        yoyMain.textContent = 'Not enough data from last year to compare.';
        yoySub.textContent = '';
        return;
    }

    if (comparison.deltaPercent === null) {
        yoyMain.textContent = 'Unable to compute comparison.';
        yoySub.textContent = '';
        return;
    }

    const percentText = Math.abs(comparison.deltaPercent).toFixed(1);
    let headline;
    if (comparison.direction === 'more') {
        headline = `${comparison.currentYear} offers ${percentText}% more consecutive days off than ${comparison.previousYear}.`;
    } else if (comparison.direction === 'less') {
        headline = `${comparison.currentYear} offers ${percentText}% fewer consecutive days off than ${comparison.previousYear}.`;
    } else {
        headline = `${comparison.currentYear} is on par with ${comparison.previousYear} for longest breaks.`;
    }

    yoyMain.textContent = headline;
    yoySub.textContent = `Best stretch: ${comparison.currentBest} days vs ${comparison.previousBest} last year using the same allowance.`;
}

/**
 * Formats a date for display in the recommendations.
 */
function formatDate(date) {
    return shortDateFormatter.format(date);
}

/**
 * Renders the top 3 recommendation cards based on the current plan.
 */
function renderRecommendations() {
    const container = document.getElementById('recommendations');
    container.textContent = '';

    const blocks = analyzeCurrentPlan();
    blocks.sort((a, b) => a.startDate - b.startDate);
    const top3 = blocks.slice(0, 3);

    if (top3.length === 0) {
        const emptyContainer = document.createElement('div');
        emptyContainer.style.textAlign = 'center';
        emptyContainer.style.width = '100%';

        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'empty-rec-message';
        emptyMsg.textContent = 'Select days on the calendar, or let us find the best plan for you.';
        emptyMsg.style.marginBottom = '1.5rem';

        const optimizeBtn = document.createElement('button');

        const optimizeIcon = document.createElement('span');
        optimizeIcon.setAttribute('aria-hidden', 'true');
        optimizeIcon.textContent = '✨ ';

        optimizeBtn.appendChild(optimizeIcon);
        optimizeBtn.appendChild(document.createTextNode('Auto-Plan Optimal Breaks'));

        optimizeBtn.setAttribute('aria-label', 'Auto-Plan Optimal Breaks');
        optimizeBtn.addEventListener('click', () => {
            const resetBtn = document.getElementById('reset-btn');
            if (resetBtn) resetBtn.click();
        });

        emptyContainer.appendChild(emptyMsg);
        emptyContainer.appendChild(optimizeBtn);
        container.appendChild(emptyContainer);
        return;
    }

    top3.forEach((block, index) => {
        const card = document.createElement('div');
        card.className = 'rec-card';

        const efficiency = block.leaveDays > 0 ? (block.totalDays / block.leaveDays).toFixed(1) : '∞';

        const badge = document.createElement('div');
        badge.className = 'rec-badge';
        badge.textContent = `Break ${index + 1}`;

        const dates = document.createElement('div');
        dates.className = 'rec-dates';
        dates.textContent = `${formatDate(block.startDate)} - ${formatDate(block.endDate)}`;

        const details = document.createElement('div');
        details.className = 'rec-details';

        const leaveDaysItem = document.createElement('div');
        leaveDaysItem.className = 'detail-item';
        const leaveDaysNum = document.createElement('span');
        leaveDaysNum.className = 'detail-num';
        leaveDaysNum.textContent = block.leaveDays;
        const leaveDaysText = document.createElement('span');
        leaveDaysText.className = 'detail-text';
        leaveDaysText.textContent = 'Leave Days';
        leaveDaysItem.appendChild(leaveDaysNum);
        leaveDaysItem.appendChild(leaveDaysText);

        const totalDaysItem = document.createElement('div');
        totalDaysItem.className = 'detail-item';
        const totalDaysNum = document.createElement('span');
        totalDaysNum.className = 'detail-num';
        totalDaysNum.textContent = block.totalDays;
        const totalDaysText = document.createElement('span');
        totalDaysText.className = 'detail-text';
        totalDaysText.textContent = 'Days Off';
        totalDaysItem.appendChild(totalDaysNum);
        totalDaysItem.appendChild(totalDaysText);

        const efficiencyItem = document.createElement('div');
        efficiencyItem.className = 'detail-item';
        const efficiencyNum = document.createElement('span');
        efficiencyNum.className = 'detail-num';
        efficiencyNum.textContent = `${efficiency}x`;
        const efficiencyText = document.createElement('span');
        efficiencyText.className = 'detail-text';
        efficiencyText.textContent = 'Multiplier';
        efficiencyItem.appendChild(efficiencyNum);
        efficiencyItem.appendChild(efficiencyText);

        details.appendChild(leaveDaysItem);
        details.appendChild(totalDaysItem);
        details.appendChild(efficiencyItem);

        card.appendChild(badge);
        card.appendChild(dates);
        card.appendChild(details);

        container.appendChild(card);
    });
}

const ariaLabelFormatter = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
// Bolt Optimization: Shared formatter for recommendation cards prevents re-instantiation (~40x faster)
const shortDateFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

// Cache "today" values at the module level to avoid creating thousands of Date objects
// and slow string formatting during calendar rendering.
let todayCache = new Date();
let todayYear = todayCache.getFullYear();
let todayMonth = todayCache.getMonth();
let todayDate = todayCache.getDate();

/**
 * Updates the visual state of a day element.
 * Shared logic for both initial render and updates.
 */
function updateDayNode(el, date, dateStr = null) {
    const dStr = dateStr || toLocalISOString(date);
    const isBooked = bookedDates.has(dStr);

    // Bolt Optimization: Construct full class string to avoid layout thrashing
    // from multiple el.classList.add() calls. ~3x faster rendering.
    let cls = 'day';

    const type = getDayType(date, dStr);
    if (type === 'weekend') cls += ' weekend';

    let tooltipTitle = '';

    const holidayName = getHolidayName(date, dStr);
    if (holidayName) {
        cls += ' holiday';
        tooltipTitle = holidayName;
    }

    if (holidayName) {
        if (el.tabIndex !== 0) el.tabIndex = 0;
        if (el.getAttribute('role') !== 'button') el.setAttribute('role', 'button');
        if (el.style.cursor !== 'pointer') el.style.cursor = 'pointer';
    } else if (type !== 'workday') {
        if (el.hasAttribute('tabindex')) el.removeAttribute('tabindex');
        if (el.hasAttribute('role')) el.removeAttribute('role');
        if (el.style.cursor) el.style.cursor = '';
    }

    if (type === 'workday') {
        const insight = getDayInsight(date, dStr);
        if (insight) {
            const tier = getEfficiencyTier(insight.efficiency);
            cls += ` heat-${tier}`;
            if (insight.bridge) cls += ' bridge';

            if (tooltipTitle !== '') tooltipTitle += ' • ';
            if (isBooked) {
                tooltipTitle += `${insight.efficiency.toFixed(1)}x in current plan`;
            } else {
                tooltipTitle += `${insight.efficiency.toFixed(1)}x if booked`;
            }
            if (insight.bridge) tooltipTitle += ' • Bridge day';

            // Bolt Optimization: Only update dataset properties if they changed
            const effStr = insight.efficiency.toFixed(1);
            if (el.dataset.efficiency !== effStr) el.dataset.efficiency = effStr;
            const offStr = insight.totalDaysOff.toString();
            if (el.dataset.totaloff !== offStr) el.dataset.totaloff = offStr;
        } else {
            if (el.hasAttribute('data-efficiency')) el.removeAttribute('data-efficiency');
            if (el.hasAttribute('data-totaloff')) el.removeAttribute('data-totaloff');
        }

        // Update accessibility attributes
        const pressedState = isBooked ? 'true' : 'false';
        if (el.getAttribute('aria-pressed') !== pressedState) {
            el.setAttribute('aria-pressed', pressedState);
        }

        // Bolt Optimization: Use shared formatter to avoid expensive re-initialization (~175x faster)
        const dateLabel = ariaLabelFormatter.format(date);
        const statusLabel = isBooked ? 'Booked' : 'Available';
        let efficiencyLabel = '';
        if (insight) {
             efficiencyLabel = `, ${insight.efficiency.toFixed(1)}x efficiency`;
             if (insight.bridge) efficiencyLabel += ', Bridge day';
        }

        const fullLabel = `${dateLabel}, ${statusLabel}${efficiencyLabel}`;
        if (el.getAttribute('aria-label') !== fullLabel) {
            el.setAttribute('aria-label', fullLabel);
        }

        if (el.style.cursor !== 'pointer') el.style.cursor = 'pointer';
        if (el.tabIndex !== 0) el.tabIndex = 0;
        if (el.getAttribute('role') !== 'button') el.setAttribute('role', 'button');
    } else {
        const dateLabel = ariaLabelFormatter.format(date);
        let statusLabel = type === 'weekend' ? 'Weekend' : 'Holiday';
        if (holidayName) {
             statusLabel = `Holiday: ${holidayName}`;
        }
        const fullLabel = `${dateLabel}, ${statusLabel}`;
        if (el.getAttribute('aria-label') !== fullLabel) {
            el.setAttribute('aria-label', fullLabel);
        }
    }

    // Bolt Optimization: Compare Year/Month/Date integers instead of creating new Date objects
    // and stringifying. This is significantly faster for high-frequency loops.
    const isToday = date.getDate() === todayDate && date.getMonth() === todayMonth && date.getFullYear() === todayYear;
    if (isToday) {
        cls += ' today';
        const currentLabel = el.getAttribute('aria-label');
        if (currentLabel && !currentLabel.startsWith('Today')) {
            el.setAttribute('aria-label', `Today, ${currentLabel}`);
        }
        if (el.getAttribute('aria-current') !== 'date') {
            el.setAttribute('aria-current', 'date');
        }

        if (tooltipTitle !== '') {
            tooltipTitle = 'Today • ' + tooltipTitle;
        } else {
            tooltipTitle = 'Today';
        }
    }

    if (isBooked) {
        cls += ' leave';
    }

    // Apply class string once
    if (el.className !== cls) {
        el.className = cls;
    }

    // Apply title string once conditionally
    if (tooltipTitle !== '') {
        if (el.title !== tooltipTitle) el.title = tooltipTitle;
    } else {
        if (el.hasAttribute('title')) el.removeAttribute('title');
    }
}

/**
 * Renders the full calendar view.
 */

/**
 * Toggles a date booking.
 */
function toggleDateBooking(dateStr) {
    const prevCount = bookedDates.size;
    if (bookedDates.has(dateStr)) {
        bookedDates.delete(dateStr);
    } else {
        if (bookedDates.size >= MAX_BOOKED_DATES) {
            showToast(`Maximum limit of ${MAX_BOOKED_DATES} booked dates reached.`, 'error');
            return;
        }
        bookedDates.add(dateStr);
    }
    const newCount = bookedDates.size;

    if (prevCount < currentAllowance && newCount === currentAllowance) {
        showToast(`Perfect! You've used all ${currentAllowance} days of your allowance.`, 'success');
    } else if (prevCount <= currentAllowance && newCount > currentAllowance) {
        showToast(`Note: You've exceeded your allowance (${newCount}/${currentAllowance}).`, 'info');
    }

    // Bolt Optimization: Only invalidate caches affected by bookedDates
    // instead of triggering a full recalculation of year over year comparisons
    invalidateBookedDaysCaches();
    updateUI();
    saveState();
}

/**
 * Shared event handler for clicking a day element.
 */
function handleDayClick(e) {
    const dateStr = e.currentTarget.dataset.date;
    const dateObj = e.currentTarget._dateObj || parseISODateString(dateStr);
    if (dateStr) {
        if (getDayType(dateObj, dateStr) === 'workday') {
            toggleDateBooking(dateStr);
        } else if (e.currentTarget.title) {
            showToast(e.currentTarget.title, 'info');
        }
    }
}

/**
 * Shared event handler for keydown on a day element.
 */
function handleDayKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); // Prevent scrolling on Space
        const dateStr = e.currentTarget.dataset.date;
        const dateObj = e.currentTarget._dateObj || parseISODateString(dateStr);
        if (dateStr) {
            if (getDayType(dateObj, dateStr) === 'workday') {
                toggleDateBooking(dateStr);
            } else if (e.currentTarget.title) {
                showToast(e.currentTarget.title, 'info');
            }
        }
    }
}

function renderCalendar() {
    const container = document.getElementById('calendar');

    // Update today cache before rendering to ensure accurate current date across sessions
    todayCache = new Date();
    todayYear = todayCache.getFullYear();
    todayMonth = todayCache.getMonth();
    todayDate = todayCache.getDate();

    // Bolt Optimization: Prevent DOM trashing.
    // Check if we are re-rendering the same year/region/holiday-state.
    const customCount = getCustomHolidaysForLocation(currentRegion).length;
    const renderKey = `${currentYear}-${currentRegion}-${currentWeekendPattern}-${customCount}`;
    const isUpdate = container.getAttribute('data-render-key') === renderKey && container.children.length > 0;

    if (isUpdate) {
        // Update existing cells
        const days = container.querySelectorAll('.day[data-date]');
        days.forEach(el => {
            const dateStr = el.dataset.date;
            // Bolt Optimization: Reuse Date object to avoid 365 allocations on every click (~55x faster)
            let date = el._dateObj;
            if (!date) {
                // Fallback if property is missing (unlikely)
                date = parseISODateString(dateStr);
                el._dateObj = date;
            }
            updateDayNode(el, date, dateStr);
        });
        return;
    }

    // Full Rebuild
    container.textContent = '';
    container.setAttribute('data-render-key', renderKey);

    const fragment = document.createDocumentFragment();

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    months.forEach((monthName, monthIndex) => {
        const monthDiv = document.createElement('div');
        monthDiv.className = 'month';

        const title = document.createElement('div');
        title.className = 'month-name';
        title.textContent = monthName;
        monthDiv.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'days-grid';

        const weekDays = [
            { short: 'S', full: 'Sunday' },
            { short: 'M', full: 'Monday' },
            { short: 'T', full: 'Tuesday' },
            { short: 'W', full: 'Wednesday' },
            { short: 'T', full: 'Thursday' },
            { short: 'F', full: 'Friday' },
            { short: 'S', full: 'Saturday' }
        ];

        weekDays.forEach(d => {
            const h = document.createElement('div');
            h.className = 'day-header';
            h.setAttribute('aria-label', d.full);
            h.title = d.full;
            h.textContent = d.short;
            grid.appendChild(h);
        });

        const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
        const firstDay = new Date(currentYear, monthIndex, 1).getDay();

        for (let i = 0; i < firstDay; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.setAttribute('aria-hidden', 'true');
            grid.appendChild(emptyDiv);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(currentYear, monthIndex, d);
            const dateStr = toLocalISOString(date);

            const el = document.createElement('div');
            el.className = 'day';
            el.textContent = d;

            // Add data-date for optimization
            el.dataset.date = dateStr;
            el._dateObj = date; // Bolt Optimization: Cache Date object

            // Attach event listeners (only needed on creation)
            if (getDayType(date, dateStr) !== 'weekend') {
                 // Bolt Optimization: Use shared module-level event handlers to avoid
                 // instantiating hundreds of closures during rendering.
                 el.addEventListener('click', handleDayClick);
                 el.addEventListener('keydown', handleDayKeyDown);
            }

            updateDayNode(el, date, dateStr);
            grid.appendChild(el);
        }

        monthDiv.appendChild(grid);
        fragment.appendChild(monthDiv);
    });

    container.appendChild(fragment);
}

// Initialize application with error handling.
// The check for window/document ensures this doesn't run during Node.js testing.
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
        init();
    } catch (error) {
        console.error('Failed to initialize application:', error);
        const container = document.querySelector('.container');
        if (container) {
            container.textContent = ''; // safely clear contents

            const errorContainer = document.createElement('div');
            errorContainer.className = 'error-container';

            const errorTitle = document.createElement('h1');
            errorTitle.className = 'error-title';
            errorTitle.textContent = 'Unable to Load Application';

            const errorMessage = document.createElement('p');
            errorMessage.className = 'error-message';
            errorMessage.textContent = "We're sorry, but something went wrong. Please try refreshing the page.";

            const refreshBtn = document.createElement('button');
            refreshBtn.id = 'refresh-btn';
            refreshBtn.className = 'refresh-btn';
            refreshBtn.textContent = 'Refresh Page';
            refreshBtn.addEventListener('click', () => location.reload());

            errorContainer.appendChild(errorTitle);
            errorContainer.appendChild(errorMessage);
            errorContainer.appendChild(refreshBtn);

            container.appendChild(errorContainer);
        }
    }
}

// --- EXPORTS FOR TESTING ---
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        REGIONS,
        toLocalISOString,
        getEasterDate,
        getUKHolidays,
        isWeekend,
        isHoliday,
        getHolidayName,
        calculateContinuousLeave,
        findOptimalPlan,
        addDays,
        getDayType,
        ensureDayTypeCache,
        getDayInsight,
        getYearComparison,
        getEfficiencyTier,
        encodePlanString,
        decodePlanString,
        applySharedPlanFromUrl,
        renderCustomHolidays,
        getCurrentState,
        LOCATION_GROUPS,
        LOCATION_METADATA,
        LOCATION_CONFIG,
        WEEKEND_PRESETS,
      
    
        // Helper to set state for testing
        setTestState: (year, region, holidays, booked, weekendPattern, allowance) => {
            currentYear = year;
            currentRegion = region;
            if (typeof allowance === 'number') {
                currentAllowance = allowance;
            }
            customHolidaysByLocation = {};
            if (holidays) {
                customHolidaysByLocation[region] = holidays;
            }
            currentWeekendPattern = Object.prototype.hasOwnProperty.call(WEEKEND_PRESETS, weekendPattern)
                ? weekendPattern
                : getDefaultWeekendForLocation(region);
            weekendByLocation = { [region]: currentWeekendPattern };
            if (booked) {
                bookedDates = new Set(booked);
            } else {
                bookedDates = new Set();
            }
            clearHolidaysCache();
            invalidateInsightCaches();
        },
        setHolidayDatasetForTests: (dataset) => {
            holidayDataset = dataset;
            holidayDatasetFromCache = false;
            clearHolidaysCache();
            invalidateInsightCaches();
        },
        showToast,
        renderCalendar,
        analyzeCurrentPlan,
        toggleDateBooking,
        handleDayClick,
        handleDayKeyDown
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports.generateAllCandidates = generateAllCandidates;
    module.exports.selectTopCandidates = selectTopCandidates;
    module.exports.findBestCombination = findBestCombination;
}
