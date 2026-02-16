/**
 * UK Vacation Maximiser Logic
 * Combined into one file to ensure it runs locally without a server.
 */

// --- STATE MANAGEMENT ---
/** @type {Object} Supported regions. */
const REGIONS = {
    ENGLAND_WALES: 'england-wales',
    SCOTLAND: 'scotland',
    NORTHERN_IRELAND: 'northern-ireland'
};
/** @type {number} Current number of annual leave days available. */
let currentAllowance = 25;
/** @type {number} The year being planned for. */
let currentYear = new Date().getFullYear();
/** @type {string} The selected region (england-wales, scotland, northern-ireland). */
let currentRegion = REGIONS.ENGLAND_WALES;
/** @type {Set<string>} Set of dates (YYYY-MM-DD) that the user has booked. */
let bookedDates = new Set();
/** @type {Array<{date: string, name: string}>} List of custom user-defined holidays. */
let customHolidays = [];

// --- PERSISTENCE ---
const STORAGE_KEY = 'vacationMaximiser';
const SHARE_PARAM = 'plan';
let shareStatusTimer = null;

/**
 * Returns the current application state.
 */
function getCurrentState() {
    return {
        currentAllowance,
        currentYear,
        currentRegion,
        bookedDates: Array.from(bookedDates),
        customHolidays
    };
}

/**
 * Builds a plain object representing the current plan state.
 */
function getPlanPayload() {
    return {
        v: 1,
        ...getCurrentState()
    };
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
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        return {
            currentAllowance: allowance,
            currentYear: typeof obj.currentYear === 'number' ? obj.currentYear : currentYear,
            currentRegion: typeof obj.currentRegion === 'string' ? obj.currentRegion : currentRegion,
            bookedDates: Array.isArray(obj.bookedDates)
                ? obj.bookedDates.filter(d => typeof d === 'string' && dateRegex.test(d))
                : [],
            customHolidays: Array.isArray(obj.customHolidays)
                ? obj.customHolidays.filter(h =>
                    h && typeof h === 'object' &&
                    typeof h.date === 'string' && dateRegex.test(h.date) &&
                    typeof h.name === 'string' && h.name.length < 100
                  )
                : []
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

        const allowedRegions = Object.values(REGIONS);
        if (!allowedRegions.includes(decoded.currentRegion)) {
            decoded.currentRegion = REGIONS.ENGLAND_WALES;
        }

        currentAllowance = decoded.currentAllowance;
        currentYear = decoded.currentYear;
        currentRegion = decoded.currentRegion;
        bookedDates = new Set(decoded.bookedDates || []);
        customHolidays = decoded.customHolidays || [];

        holidaysCache.clear();
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
    const url = new URL(window.location.href);
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
    toast.textContent = message;

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
 * Shows a temporary status message near the share button.
 */
function showShareStatus(message, isError = false) {
    const statusEl = document.getElementById('share-status');
    if (!statusEl) return;
    statusEl.textContent = message;
    if (isError) {
        statusEl.classList.add('error');
    } else {
        statusEl.classList.remove('error');
    }
    statusEl.style.color = '';
    if (shareStatusTimer) clearTimeout(shareStatusTimer);
    shareStatusTimer = setTimeout(() => {
        statusEl.textContent = '';
        statusEl.classList.remove('error');
    }, 3000);
}

/**
 * Copies the shareable link to the clipboard (with fallback).
 */
async function handleShareLink() {
    const shareUrl = buildShareableUrl();
    if (!shareUrl) {
        showShareStatus('Unable to create share link', true);
        return;
    }

    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(shareUrl);
            showShareStatus('Link copied!');
        } else {
            throw new Error('Clipboard API not available');
        }
    } catch (e) {
        console.warn('Copy failed:', e);
        showShareStatus('Copy failed', true);
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

// --- HOLIDAYS ---

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
    return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
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
    customHolidays.forEach(h => {
        // Only if it doesn't already exist (simple check)
        if (!holidays.some(eh => eh.date === h.date)) {
            holidays.push(h);
        }
    });

    return holidays;
}

// Cache holidays for performance
const holidaysCache = new Map();
// Cache per-date insights (efficiency + bridge) to avoid recomputation while interacting.
const dayInsightCache = new Map();
// Cache year-over-year comparison to avoid recomputing optimal plans unnecessarily.
const yearComparisonCache = new Map();

// Cache day types for current year to avoid repeated checks
let dayTypeCache = null;
let dayTypeCacheYear = null;

function invalidateInsightCaches() {
    dayInsightCache.clear();
    yearComparisonCache.clear();
    dayTypeCache = null;
}

/**
 * Ensures the day type cache is populated for the current year.
 */
function ensureDayTypeCache() {
    if (dayTypeCache && dayTypeCacheYear === currentYear) return;

    dayTypeCacheYear = currentYear;

    // Determine number of days in year
    const isLeap = new Date(currentYear, 1, 29).getMonth() === 1;
    const daysCount = isLeap ? 366 : 365;

    dayTypeCache = new Array(daysCount);

    let current = new Date(currentYear, 0, 1);
    for (let i = 0; i < daysCount; i++) {
        let type = 'workday';
        if (isHoliday(current)) type = 'holiday';
        else if (isWeekend(current)) type = 'weekend';

        dayTypeCache[i] = type;
        current.setDate(current.getDate() + 1);
    }
}

/**
 * Retrieves UK bank holidays for a given year and region.
 * @param {number} year The year to get holidays for.
 * @param {string} region The region code.
 * @returns {Array<{date: string, name: string}>} A list of holiday objects.
 */
function getHolidaysForYear(year, region) {
    const key = `${year}-${region}-${customHolidays.length}`; // Simple cache bust on custom change
    if (!holidaysCache.has(key)) {
        const holidays = getUKHolidays(year, region);
        const lookup = new Map(holidays.map(h => [h.date, h]));
        holidaysCache.set(key, { holidays, lookup });
    }
    return holidaysCache.get(key);
}

/**
 * Checks if a given date falls on a weekend.
 * @param {Date} date The date to check.
 * @returns {boolean} True if the date is a Saturday or Sunday.
 */
function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6;
}

/**
 * Checks if a given date is a holiday.
 * @param {Date} date The date to check.
 * @returns {boolean} True if the date is a holiday.
 */
function isHoliday(date) {
    return getHolidayName(date) !== null;
}

/**
 * Retrieves the name of the holiday for a given date.
 * @param {Date} date The date to check.
 * @returns {string|null} The name of the holiday or null if it's not a holiday.
 */
function getHolidayName(date) {
    const year = date.getFullYear();
    const { lookup } = getHolidaysForYear(year, currentRegion);
    const dateString = toLocalISOString(date);
    const holiday = lookup.get(dateString);
    return holiday ? holiday.name : null;
}

// --- OPTIMIZER ---

/**
 * Determines the type of a given day (workday, weekend, or holiday).
 * @param {Date} date The date to classify.
 * @returns {('workday'|'weekend'|'holiday')} The type of the day.
 */
function getDayType(date) {
    // Optimization: Check if date is within current cached year
    if (date.getFullYear() === currentYear) {
        if (!dayTypeCache) ensureDayTypeCache();

        const startOfYear = new Date(currentYear, 0, 1);
        const diff = date - startOfYear;
        // Use Math.round to handle potential DST shifts (usually 1 hour)
        const dayIndex = Math.round(diff / (1000 * 60 * 60 * 24));

        if (dayIndex >= 0 && dayIndex < dayTypeCache.length) {
            return dayTypeCache[dayIndex];
        }
    }

    if (isHoliday(date)) return 'holiday';
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
function getDayInsight(date) {
    if (getDayType(date) !== 'workday') return null;
    const key = `${toLocalISOString(date)}-${currentRegion}-${customHolidays.length}`;
    if (!dayInsightCache.has(key)) {
        const result = calculateContinuousLeave(date, 1, bookedDates);
        const prev = addDays(date, -1);
        const next = addDays(date, 1);
        const bridge = isDayOff(prev, bookedDates) && isDayOff(next, bookedDates);
        const efficiency = result ? result.efficiency : 1;
        const totalDaysOff = result ? result.totalDaysOff : 1;
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
    const key = `${year}-${allowance}-${currentRegion}-${customHolidays.length}`;
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
            leaveDaysBooked.push(new Date(current));
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
        bookedDates: leaveDaysBooked
    };
}

/**
 * Generates and deduplicates all reasonable leave candidates.
 * @param {number} year The year to plan for.
 * @param {number} allowance The number of leave days available.
 * @returns {Array<Object>} List of unique candidate blocks.
 */
function generateAllCandidates(year, allowance) {
    const candidates = [];
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    let current = new Date(startOfYear);
    while (current <= endOfYear) {
        if (getDayType(current) === 'workday') {
            const maxChunk = allowance; // Allow checking up to full allowance
            for (let i = 1; i <= maxChunk; i++) {
                const result = calculateContinuousLeave(current, i);
                if (result) {
                    candidates.push(result);
                }
            }
        }
        // Optimization: Mutate date in place
        current.setDate(current.getDate() + 1);
    }

    // Deduplicate candidates
    const uniqueCandidates = [];
    const seen = new Set();
    candidates.forEach(c => {
        const key = `${c.startDate.toISOString()}-${c.endDate.toISOString()}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueCandidates.push(c);
        }
    });

    return uniqueCandidates;
}

/**
 * Selects the top candidates based on efficiency and duration.
 * @param {Array<Object>} candidates List of all candidates.
 * @returns {Array<Object>} Filtered list of top candidates.
 */
function selectTopCandidates(candidates) {
    const sortedByEfficiency = [...candidates].sort((a, b) => b.efficiency - a.efficiency);
    const efficientCandidates = sortedByEfficiency.slice(0, 100);

    const sortedByDuration = [...candidates].sort((a, b) => b.totalDaysOff - a.totalDaysOff);
    const longCandidates = sortedByDuration.slice(0, 50);

    const combinedCandidates = [...efficientCandidates, ...longCandidates];
    const finalCandidates = [];
    const finalSeen = new Set();

    combinedCandidates.forEach(c => {
        const key = `${c.startDate.toISOString()}-${c.endDate.toISOString()}`;
        if (!finalSeen.has(key)) {
            finalSeen.add(key);
            finalCandidates.push(c);
        }
    });

    finalCandidates.sort((a, b) => b.efficiency - a.efficiency);
    return finalCandidates;
}

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
    const sortedCandidates = [...candidates].sort((a, b) => a.startDate - b.startDate);
    const N = sortedCandidates.length;

    // Precompute next compatible candidate index for each candidate
    // nextCompatible[i] = index of first candidate that starts after candidate[i] ends
    const nextCompatible = new Int32Array(N);
    let j = 0;
    for (let i = 0; i < N; i++) {
        if (j < i + 1) j = i + 1;
        while (j < N && sortedCandidates[j].startDate <= sortedCandidates[i].endDate) {
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

    // Initialize with -1 (representing invalid/unreachable)
    const memo = new Int32Array((N + 1) * ROW_SIZE).fill(-1);

    // Base case: i=N (no candidates left).
    // If k=0, totalOff=0. Else -1 (remain default).
    for (let w = 0; w <= W_MAX; w++) {
        memo[N * ROW_SIZE + 0 * SIZE_W + w] = 0;
    }

    // Fill DP table backwards
    for (let i = N - 1; i >= 0; i--) {
        for (let k = 0; k <= K_MAX; k++) {
            for (let w = 0; w <= W_MAX; w++) {
                // Option 1: Skip candidate i
                let res = memo[(i + 1) * ROW_SIZE + k * SIZE_W + w];

                // Option 2: Take candidate i (if allowed)
                if (k > 0) {
                    const cost = sortedCandidates[i].leaveDaysUsed;
                    if (w >= cost) {
                        const nextI = nextCompatible[i];
                        const prevVal = memo[nextI * ROW_SIZE + (k - 1) * SIZE_W + (w - cost)];

                        if (prevVal !== -1) {
                            const currentVal = sortedCandidates[i].totalDaysOff + prevVal;
                            if (currentVal > res) {
                                res = currentVal;
                            }
                        }
                    }
                }
                memo[i * ROW_SIZE + k * SIZE_W + w] = res;
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

    bestCombo.sort((a, b) => a.startDate - b.startDate);
    return bestCombo;
}

function findOptimalPlan(year, allowance) {
    const uniqueCandidates = generateAllCandidates(year, allowance);
    const topCandidates = selectTopCandidates(uniqueCandidates);
    return findBestCombination(topCandidates, allowance);
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
    const blocks = analyzeCurrentPlan();
    if (blocks.length === 0) {
        showToast('No leave periods to export. Please book some leave days first.', 'error');
        return;
    }

    // Build iCal content
    const icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//UK Vacation Maximiser//EN',
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
            `DESCRIPTION:${block.totalDays} days off using ${block.leaveDays} leave days\\nGenerated by UK Vacation Maximiser`,
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
}

// --- MAIN UI ---

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
        if (typeof savedState.currentAllowance === 'number') {
            currentAllowance = savedState.currentAllowance;
        }
        if (typeof savedState.currentYear === 'number') {
            currentYear = savedState.currentYear;
        }
        if (typeof savedState.currentRegion === 'string') {
            currentRegion = savedState.currentRegion;
        }
        if (Array.isArray(savedState.bookedDates)) {
            bookedDates = new Set(savedState.bookedDates);
            shouldRestoreFromSaved = savedState.bookedDates.length > 0;
        }
        if (Array.isArray(savedState.customHolidays)) {
            customHolidays = savedState.customHolidays;
        }
    } else if (appliedSharedPlan) {
        shouldRestoreFromSaved = bookedDates.size > 0;
        // Persist the shared plan locally for subsequent visits
        saveState();
    }

    const yearSelect = document.getElementById('year-select');
    if (yearSelect) {
        yearSelect.innerHTML = '';
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
            invalidateInsightCaches();
            resetToOptimal();
            saveState();
        });
    }

    const regionSelect = document.getElementById('region-select');
    if (regionSelect) {
        regionSelect.value = currentRegion;
        regionSelect.addEventListener('change', (e) => {
            currentRegion = e.target.value;
            // Clear cache to force reload of holidays for new region
            holidaysCache.clear();
            invalidateInsightCaches();
            resetToOptimal();
            saveState();
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
    const addCustomBtn = document.getElementById('add-custom-btn');
    if (addCustomBtn) {
        addCustomBtn.addEventListener('click', addCustomHoliday);
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
        // Prevent dupes
        if (!customHolidays.some(h => h.date === dateVal)) {
            customHolidays.push({ date: dateVal, name: nameVal, isCustom: true });
            renderCustomHolidays();
            holidaysCache.clear(); // Reset cache to include new holiday
            invalidateInsightCaches();
            resetToOptimal();
            saveState();
            dateInput.value = '';
            nameInput.value = '';
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
    customHolidays = customHolidays.filter(h => h.date !== dateStr);
    renderCustomHolidays();
    holidaysCache.clear();
    invalidateInsightCaches();
    resetToOptimal();
    saveState();
}

/**
 * Renders the list of custom holidays.
 */
function renderCustomHolidays() {
    const list = document.getElementById('custom-holidays-list');
    if (!list) return;
    list.innerHTML = '';
    customHolidays.forEach(h => {
        const tag = document.createElement('div');
        tag.className = 'custom-tag';
        tag.textContent = `${h.name} (${h.date}) `;

        const btn = document.createElement('button');
        btn.innerHTML = '&times;';
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
        loader.innerHTML = `
            <div class="spinner-container">
                <div class="spinner"></div>
                <p>Optimizing your vacation plan...</p>
            </div>
        `;
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
function resetToOptimal() {
    showLoading();
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
    renderCalendar();
}

/**
 * Analyzes the currently selected `bookedDates` to identify continuous blocks of time off.
 */
function analyzeCurrentPlan() {
    const dates = Array.from(bookedDates).sort();
    if (dates.length === 0) return [];

    const blocks = [];
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);

    let currentBlock = null;
    let current = new Date(startOfYear);

    while (current <= endOfYear) {
        const dateStr = toLocalISOString(current);
        const type = getDayType(current);
        const isBooked = bookedDates.has(dateStr);
        const isOff = isBooked || type === 'weekend' || type === 'holiday';

        if (isOff) {
            if (!currentBlock) {
                currentBlock = {
                    startDate: new Date(current),
                    endDate: new Date(current),
                    leaveDays: 0,
                    totalDays: 0
                };
            }
            currentBlock.endDate = new Date(current);
            currentBlock.totalDays++;
            if (isBooked) currentBlock.leaveDays++;
        } else {
            if (currentBlock) {
                if (currentBlock.leaveDays > 0) {
                    blocks.push(currentBlock);
                }
                currentBlock = null;
            }
        }
        current = addDays(current, 1);
    }
    if (currentBlock && currentBlock.leaveDays > 0) {
        blocks.push(currentBlock);
    }

    blocks.sort((a, b) => b.totalDays - a.totalDays);
    return blocks;
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
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/**
 * Renders the top 3 recommendation cards based on the current plan.
 */
function renderRecommendations() {
    const container = document.getElementById('recommendations');
    container.innerHTML = '';

    const blocks = analyzeCurrentPlan();
    blocks.sort((a, b) => a.startDate - b.startDate);
    const top3 = blocks.slice(0, 3);

    if (top3.length === 0) {
        container.innerHTML = '<p style="text-align:center; width:100%; opacity:0.7;">Select days on the calendar to plan your leave.</p>';
        return;
    }

    top3.forEach((block, index) => {
        const card = document.createElement('div');
        card.className = 'rec-card';

        const efficiency = block.leaveDays > 0 ? (block.totalDays / block.leaveDays).toFixed(1) : '∞';

        card.innerHTML = `
            <div class="rec-badge">Break ${index + 1}</div>
            <div class="rec-dates">
                ${formatDate(block.startDate)} - ${formatDate(block.endDate)}
            </div>
            <div class="rec-details">
                <div class="detail-item">
                    <span class="detail-num">${block.leaveDays}</span>
                    <span class="detail-text">Leave Days</span>
                </div>
                <div class="detail-item">
                    <span class="detail-num">${block.totalDays}</span>
                    <span class="detail-text">Days Off</span>
                </div>
                <div class="detail-item">
                    <span class="detail-num">${efficiency}x</span>
                    <span class="detail-text">Multiplier</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

/**
 * Updates the visual state of a day element.
 * Shared logic for both initial render and updates.
 */
function updateDayNode(el, date) {
    const dateStr = toLocalISOString(date);
    const isBooked = bookedDates.has(dateStr);

    // Reset classes
    el.className = 'day';

    const type = getDayType(date);
    if (type === 'weekend') el.classList.add('weekend');

    const tooltipParts = [];

    const holidayName = getHolidayName(date);
    if (holidayName) {
        el.classList.add('holiday');
        tooltipParts.push(holidayName);
    }

    if (type === 'workday') {
        const insight = getDayInsight(date);
        if (insight) {
            const tier = getEfficiencyTier(insight.efficiency);
            el.classList.add(`heat-${tier}`);
            if (insight.bridge) el.classList.add('bridge');
            if (isBooked) {
                tooltipParts.push(`${insight.efficiency.toFixed(1)}x in current plan`);
            } else {
                tooltipParts.push(`${insight.efficiency.toFixed(1)}x if booked`);
            }
            if (insight.bridge) tooltipParts.push('Bridge day');
            el.dataset.efficiency = insight.efficiency.toFixed(1);
            el.dataset.totaloff = insight.totalDaysOff;
        } else {
            delete el.dataset.efficiency;
            delete el.dataset.totaloff;
        }

        // Update accessibility attributes
        el.setAttribute('aria-pressed', isBooked ? 'true' : 'false');

        const dateLabel = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
        const statusLabel = isBooked ? 'Booked' : 'Available';
        let efficiencyLabel = '';
        if (insight) {
             efficiencyLabel = `, ${insight.efficiency.toFixed(1)}x efficiency`;
             if (insight.bridge) efficiencyLabel += ', Bridge day';
        }
        el.setAttribute('aria-label', `${dateLabel}, ${statusLabel}${efficiencyLabel}`);

        el.style.cursor = 'pointer';
        el.tabIndex = 0;
        el.setAttribute('role', 'button');
    }

    if (isBooked) {
        el.classList.add('leave');
    }

    if (tooltipParts.length > 0) {
        el.title = tooltipParts.join(' • ');
    } else {
        el.removeAttribute('title');
    }
}

/**
 * Renders the full calendar view.
 */
function renderCalendar() {
    const container = document.getElementById('calendar');

    // Bolt Optimization: Prevent DOM trashing.
    // Check if we are re-rendering the same year/region/holiday-state.
    const renderKey = `${currentYear}-${currentRegion}-${customHolidays.length}`;
    const isUpdate = container.getAttribute('data-render-key') === renderKey && container.children.length > 0;

    if (isUpdate) {
        // Update existing cells
        const days = container.querySelectorAll('.day[data-date]');
        days.forEach(el => {
            const dateStr = el.dataset.date;
            // Reconstruct date object from string (YYYY-MM-DD)
            const [y, m, d] = dateStr.split('-').map(Number);
            const date = new Date(y, m - 1, d);
            updateDayNode(el, date);
        });
        return;
    }

    // Full Rebuild
    container.innerHTML = '';
    container.setAttribute('data-render-key', renderKey);

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

        ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(d => {
            const h = document.createElement('div');
            h.className = 'day-header';
            h.textContent = d;
            grid.appendChild(h);
        });

        const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
        const firstDay = new Date(currentYear, monthIndex, 1).getDay();

        for (let i = 0; i < firstDay; i++) {
            grid.appendChild(document.createElement('div'));
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(currentYear, monthIndex, d);
            const dateStr = toLocalISOString(date);

            const el = document.createElement('div');
            el.className = 'day';
            el.textContent = d;

            // Add data-date for optimization
            el.dataset.date = dateStr;

            // Attach event listeners (only needed on creation)
            if (getDayType(date) === 'workday') {
                 const toggleDate = () => {
                    if (bookedDates.has(dateStr)) {
                        bookedDates.delete(dateStr);
                    } else {
                        bookedDates.add(dateStr);
                    }
                    invalidateInsightCaches();
                    updateUI();
                    saveState();
                 };

                 el.addEventListener('click', toggleDate);
                 el.addEventListener('keydown', (e) => {
                     if (e.key === 'Enter' || e.key === ' ') {
                         e.preventDefault(); // Prevent scrolling on Space
                         toggleDate();
                     }
                 });
            }

            updateDayNode(el, date);
            grid.appendChild(el);
        }

        monthDiv.appendChild(grid);
        container.appendChild(monthDiv);
    });
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
            container.innerHTML = `
                <div style="text-align: center; padding: 4rem 2rem;">
                    <h1 style="color: var(--text-color); margin-bottom: 1rem;">Unable to Load Application</h1>
                    <p style="color: var(--text-color); opacity: 0.8; margin-bottom: 2rem;">
                        We're sorry, but something went wrong. Please try refreshing the page.
                    </p>
                    <button onclick="location.reload()" style="
                        background: var(--accent-color);
                        color: white;
                        border: none;
                        padding: 1rem 2rem;
                        font-size: 1rem;
                        font-weight: 600;
                        border-radius: 50px;
                        cursor: pointer;
                    ">Refresh Page</button>
                </div>
            `;
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
        getDayInsight,
        getYearComparison,
        getEfficiencyTier,
        encodePlanString,
        decodePlanString,
        renderCustomHolidays,
        getCurrentState,
      
    
        // Helper to set state for testing
        setTestState: (year, region, holidays, booked) => {
            currentYear = year;
            currentRegion = region;
            if (holidays) customHolidays = holidays;
            if (booked) {
                bookedDates = new Set(booked);
            } else {
                bookedDates = new Set();
            }
            holidaysCache.clear();
            invalidateInsightCaches();
        }
    };
}
