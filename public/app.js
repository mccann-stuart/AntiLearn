/**
 * UK Vacation Maximiser Logic
 * Combined into one file to ensure it runs locally without a server.
 */

// --- STATE MANAGEMENT ---
let currentAllowance = 25;
let currentYear = new Date().getFullYear();
let currentRegion = 'england-wales';
let bookedDates = new Set();
let customHolidays = [];

// --- PERSISTENCE ---
const STORAGE_KEY = 'vacationMaximiser';

/**
 * Saves the current application state to localStorage.
 */
function saveState() {
    const state = {
        currentAllowance,
        currentYear,
        currentRegion,
        bookedDates: Array.from(bookedDates),
        customHolidays
    };
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
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Calculates the date of Easter Sunday for a given year using the anonymous Gregorian algorithm.
 * @param {number} year The year to calculate Easter for.
 * @returns {Date} The date of Easter Sunday.
 */
function getEasterDate(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
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

    // Helper to add holiday with substitute logic
    function addHoliday(date, name, substituteRule = 'next-monday') {
        let d = new Date(date);
        const day = d.getDay();

        if (day === 0) { // Sunday
            if (substituteRule === 'next-monday') d.setDate(d.getDate() + 1);
            else if (substituteRule === 'next-tuesday') d.setDate(d.getDate() + 2); // if Mon is also holiday
        } else if (day === 6) { // Saturday
            if (substituteRule === 'next-monday') d.setDate(d.getDate() + 2);
            else if (substituteRule === 'next-tuesday') d.setDate(d.getDate() + 3); // unlikely but possible logic
        }

        // Special check for Christmas/Boxing Day overlap logic is handled manually below
        holidays.push({ date: toLocalISOString(d), name: name + (d.getTime() !== date.getTime() ? " (Substitute)" : "") });
    }

    // 1. New Year's Day (Jan 1) - ALL
    addHoliday(new Date(year, 0, 1), "New Year's Day");

    // 2. Jan 2nd - SCOTLAND ONLY
    if (region === 'scotland') {
        // Logic: If Jan 2 is Sat/Sun, substitute to next available workday (Mon/Tue)
        // Note: If Jan 1 was Sun->Mon, Jan 2 is Mon->Tue.
        let jan2 = new Date(year, 0, 2);
        if (jan2.getDay() === 0 || jan2.getDay() === 6 || (jan2.getDay() === 1 && isHoliday(new Date(year, 0, 1)))) {
            // Simplify: Just push it and let logic handle or implement specific sub logic
            // Standard Scotland logic: if Jan 2 is Sun, Mon is Jan 2 sub? 
            // If Jan 1 is Sat (sub Mon), Jan 2 is Sun (sub Tue).
            let d = new Date(year, 0, 2);
            if (d.getDay() === 0) d.setDate(d.getDate() + 1); // Sun -> Mon
            else if (d.getDay() === 6) d.setDate(d.getDate() + 2); // Sat -> Mon

            // Check if clash with New Year's substitute
            const jan1Sub = holidays.find(h => h.name.includes("New Year"));
            if (jan1Sub && jan1Sub.date === toLocalISOString(d)) {
                d.setDate(d.getDate() + 1); // Move to next day
            }
            holidays.push({ date: toLocalISOString(d), name: "2nd January" });
        } else {
            holidays.push({ date: toLocalISOString(jan2), name: "2nd January" });
        }
    }

    // 3. St Patrick's Day (Mar 17) - NI ONLY
    if (region === 'northern-ireland') {
        addHoliday(new Date(year, 2, 17), "St Patrick's Day");
    }

    // 4. Good Friday (Easter - 2) - ALL
    const easter = getEasterDate(year);
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    holidays.push({ date: toLocalISOString(goodFriday), name: "Good Friday" });

    // 5. Easter Monday (Easter + 1) - ALL EXCEPT SCOTLAND
    if (region !== 'scotland') {
        const easterMonday = new Date(easter);
        easterMonday.setDate(easter.getDate() + 1);
        holidays.push({ date: toLocalISOString(easterMonday), name: "Easter Monday" });
    }

    // 6. Early May Bank Holiday (First Monday in May) - ALL
    let mayDay = new Date(year, 4, 1);
    while (mayDay.getDay() !== 1) {
        mayDay.setDate(mayDay.getDate() + 1);
    }
    holidays.push({ date: toLocalISOString(mayDay), name: "Early May Bank Holiday" });

    // 7. Spring Bank Holiday (Last Monday in May) - ALL
    let springBank = new Date(year, 4, 31);
    while (springBank.getDay() !== 1) {
        springBank.setDate(springBank.getDate() - 1);
    }
    holidays.push({ date: toLocalISOString(springBank), name: "Spring Bank Holiday" });

    // 8. Orangemen's Day (July 12) - NI ONLY
    if (region === 'northern-ireland') {
        addHoliday(new Date(year, 6, 12), "Battle of the Boyne (Orangemen's Day)");
    }

    // 9. Summer Bank Holiday (First Monday in Aug for SCOTLAND, Last Monday in Aug for E/W/NI)
    if (region === 'scotland') {
        let summerBank = new Date(year, 7, 1);
        while (summerBank.getDay() !== 1) {
            summerBank.setDate(summerBank.getDate() + 1);
        }
        holidays.push({ date: toLocalISOString(summerBank), name: "Summer Bank Holiday" });
    } else {
        let summerBank = new Date(year, 7, 31);
        while (summerBank.getDay() !== 1) {
            summerBank.setDate(summerBank.getDate() - 1);
        }
        holidays.push({ date: toLocalISOString(summerBank), name: "Summer Bank Holiday" });
    }

    // 10. St Andrew's Day (Nov 30) - SCOTLAND ONLY
    if (region === 'scotland') {
        addHoliday(new Date(year, 10, 30), "St Andrew's Day");
    }

    // 11. Christmas Day (Dec 25) - ALL
    let xmas = new Date(year, 11, 25);
    let xmasSub = null;
    let boxingSub = null; // Prepare for Boxing Day logic interaction

    if (xmas.getDay() === 6) { // Sat
        xmasSub = new Date(year, 11, 27); // Mon
    } else if (xmas.getDay() === 0) { // Sun
        xmasSub = new Date(year, 11, 27); // Tue (because Boxing Day is Mon) - Actually usually Xmas sub is 27th if Sun
        // Logic: 25 Sun -> 26 Mon is Boxing Day -> 27 Tue is Xmas Sub
    }

    if (xmasSub) {
        holidays.push({ date: toLocalISOString(xmasSub), name: "Christmas Day (Substitute)" });
    } else {
        holidays.push({ date: toLocalISOString(xmas), name: "Christmas Day" });
    }

    // 12. Boxing Day (Dec 26) - ALL
    let boxing = new Date(year, 11, 26);
    // Logic: 
    // If 26 is Sat -> Sub is Mon 28
    // If 26 is Sun -> Sub is Mon 27? No, Xmas was Sat -> Mon 27. So Boxing Sub is Tue 28.
    // If 25 Sun -> 26 Mon (Boxing) -> 27 Tue (Xmas Sub).

    if (boxing.getDay() === 6) { // Sat
        boxingSub = new Date(year, 11, 28); // Mon
    } else if (boxing.getDay() === 0) { // Sun
        boxingSub = new Date(year, 11, 28); // Tue (because 27 is Xmas sub)
    }

    if (boxingSub) {
        holidays.push({ date: toLocalISOString(boxingSub), name: "Boxing Day (Substitute)" });
    } else {
        holidays.push({ date: toLocalISOString(boxing), name: "Boxing Day" });
    }

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

/**
 * Retrieves UK bank holidays for a given year and region.
 * @param {number} year The year to get holidays for.
 * @param {string} region The region code.
 * @returns {Array<{date: string, name: string}>} A list of holiday objects.
 */
function getHolidaysForYear(year, region) {
    const key = `${year}-${region}-${customHolidays.length}`; // Simple cache bust on custom change
    if (!holidaysCache.has(key)) {
        holidaysCache.set(key, getUKHolidays(year, region));
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
    const year = date.getFullYear();
    const holidays = getHolidaysForYear(year, currentRegion);
    const dateString = toLocalISOString(date);
    return holidays.some(h => h.date === dateString);
}

/**
 * Retrieves the name of the holiday for a given date.
 * @param {Date} date The date to check.
 * @returns {string|null} The name of the holiday or null if it's not a holiday.
 */
function getHolidayName(date) {
    const year = date.getFullYear();
    const holidays = getHolidaysForYear(year, currentRegion);
    const dateString = toLocalISOString(date);
    const holiday = holidays.find(h => h.date === dateString);
    return holiday ? holiday.name : null;
}

// --- OPTIMIZER ---

/**
 * Determines the type of a given day (workday, weekend, or holiday).
 * @param {Date} date The date to classify.
 * @returns {('workday'|'weekend'|'holiday')} The type of the day.
 */
function getDayType(date) {
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
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Calculates a continuous block of time off based on a starting workday and a number of leave days.
 * It expands the block to include adjacent weekends and holidays.
 */
function calculateContinuousLeave(startDate, leaveDaysToUse) {
    let leaveDaysBooked = [];
    let current = new Date(startDate);
    let daysCounted = 0;

    // Find consecutive workdays
    while (getDayType(current) !== 'workday') {
        current = addDays(current, 1);
    }

    while (daysCounted < leaveDaysToUse) {
        if (getDayType(current) === 'workday') {
            leaveDaysBooked.push(new Date(current));
            daysCounted++;
        }
        current = addDays(current, 1);
    }

    if (leaveDaysBooked.length === 0) return null;

    const firstBookedDay = leaveDaysBooked[0];
    const lastBookedDay = leaveDaysBooked[leaveDaysBooked.length - 1];

    // Expand backwards
    let rangeStart = new Date(firstBookedDay);
    while (true) {
        const prevDay = addDays(rangeStart, -1);
        if (getDayType(prevDay) !== 'workday') {
            rangeStart = prevDay;
        } else {
            break;
        }
    }

    // Expand forwards
    let rangeEnd = new Date(lastBookedDay);
    while (true) {
        const nextDay = addDays(rangeEnd, 1);
        if (getDayType(nextDay) !== 'workday') {
            rangeEnd = nextDay;
        } else {
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
 * Finds the best combination of up to 3 leave blocks to maximize days off within a given allowance.
 */
function findOptimalPlan(year, allowance) {
    const candidates = [];
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    // 1. Generate all reasonable candidates (blocks of 3 to allowance leave days)
    let current = new Date(startOfYear);
    while (current <= endOfYear) {
        if (getDayType(current) === 'workday') {
            const maxChunk = allowance; // Allow checking up to full allowance
            for (let i = 3; i <= maxChunk; i++) {
                const result = calculateContinuousLeave(current, i);
                if (result) {
                    candidates.push(result);
                }
            }
        }
        current = addDays(current, 1);
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

    // Strategy Logic
    const sortedByEfficiency = [...uniqueCandidates].sort((a, b) => b.efficiency - a.efficiency);
    const efficientCandidates = sortedByEfficiency.slice(0, 100);

    const sortedByDuration = [...uniqueCandidates].sort((a, b) => b.totalDaysOff - a.totalDaysOff);
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
    const topCandidates = finalCandidates;

    // 2. Find best combination of 3 blocks
    let bestCombo = [];
    let maxScore = -1;

    function getScore(c1, c2, c3) {
        const totalLeave = (c1 ? c1.leaveDaysUsed : 0) + (c2 ? c2.leaveDaysUsed : 0) + (c3 ? c3.leaveDaysUsed : 0);
        const totalOff = (c1 ? c1.totalDaysOff : 0) + (c2 ? c2.totalDaysOff : 0) + (c3 ? c3.totalDaysOff : 0);
        return (totalLeave * 1000) + totalOff;
    }

    for (let i = 0; i < topCandidates.length; i++) {
        for (let j = i + 1; j < topCandidates.length; j++) {
            if (overlap(topCandidates[i], topCandidates[j])) continue;
            if (topCandidates[i].leaveDaysUsed + topCandidates[j].leaveDaysUsed > allowance) continue;

            for (let k = j + 1; k < topCandidates.length; k++) {
                const c1 = topCandidates[i];
                const c2 = topCandidates[j];
                const c3 = topCandidates[k];

                if (overlap(c2, c3) || overlap(c1, c3)) continue;

                const totalLeave = c1.leaveDaysUsed + c2.leaveDaysUsed + c3.leaveDaysUsed;
                if (totalLeave <= allowance) {
                    const score = getScore(c1, c2, c3);
                    if (score > maxScore) {
                        maxScore = score;
                        bestCombo = [c1, c2, c3];
                    }
                }
            }
        }
    }

    if (bestCombo.length === 0) {
        for (let i = 0; i < topCandidates.length; i++) {
            for (let j = i + 1; j < topCandidates.length; j++) {
                const c1 = topCandidates[i];
                const c2 = topCandidates[j];
                if (!overlap(c1, c2) && (c1.leaveDaysUsed + c2.leaveDaysUsed <= allowance)) {
                    const score = getScore(c1, c2, null);
                    if (score > maxScore) {
                        maxScore = score;
                        bestCombo = [c1, c2];
                    }
                }
            }
        }
    }

    if (bestCombo.length === 0 && topCandidates.length > 0) {
        if (topCandidates[0].leaveDaysUsed <= allowance) {
            bestCombo = [topCandidates[0]];
        }
    }

    bestCombo.sort((a, b) => a.startDate - b.startDate);
    return bestCombo;
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
        alert('No leave periods to export. Please book some leave days first.');
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

    if (savedState) {
        // Restore state variables
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
    }

    const yearSelect = document.getElementById('year-select');
    if (yearSelect) {
        yearSelect.innerHTML = '';
        const currentYearNow = new Date().getFullYear();
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
                resetToOptimal();
                saveState();
            }
        });
    }

    document.getElementById('reset-btn').addEventListener('click', () => {
        resetToOptimal();
        saveState();
    });

    // Custom Holiday Logic
    document.getElementById('add-custom-btn').addEventListener('click', addCustomHoliday);

    // Export Button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToICS);
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
            resetToOptimal();
            saveState();
            dateInput.value = '';
            nameInput.value = '';
        } else {
            alert('A custom holiday for this date already exists.');
        }
    } else {
        alert('Please enter both a date and a name.');
    }
}

/**
 * Removes a custom holiday.
 */
function removeCustomHoliday(dateStr) {
    customHolidays = customHolidays.filter(h => h.date !== dateStr);
    renderCustomHolidays();
    holidaysCache.clear();
    resetToOptimal();
    saveState();
}

/**
 * Renders the list of custom holidays.
 */
function renderCustomHolidays() {
    const list = document.getElementById('custom-holidays-list');
    list.innerHTML = '';
    customHolidays.forEach(h => {
        const tag = document.createElement('div');
        tag.className = 'custom-tag';
        tag.innerHTML = `
            ${h.name} (${h.date})
            <button onclick="removeCustomHoliday('${h.date}')">&times;</button>
        `;
        // We need to attach the event listener properly safely or expose function globally
        // For simplicity in this single-file setup, we'll attach listener directly
        tag.querySelector('button').addEventListener('click', (e) => {
            e.stopPropagation(); // prevent other clicks
            removeCustomHoliday(h.date);
        });
        list.appendChild(tag);
    });
}

/**
 * Sets up a scroll listener to handle the sticky header's appearance.
 */
function initScrollHandler() {
    const header = document.getElementById('sticky-header');
    const placeholder = document.getElementById('sticky-placeholder');
    const threshold = 100; // Scroll threshold
    let ticking = false;
    let originalHeight = null;

    function handleScroll() {
        if (window.scrollY > threshold && !document.body.classList.contains('scrolled')) {
            if (!originalHeight) {
                originalHeight = header.offsetHeight;
            }
            placeholder.style.height = `${originalHeight}px`;
            document.body.classList.add('scrolled');
        } else if (window.scrollY <= threshold && document.body.classList.contains('scrolled')) {
            document.body.classList.remove('scrolled');
            setTimeout(() => {
                if (window.scrollY <= threshold) {
                    placeholder.style.height = '0';
                }
            }, 300);
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
        usedEl.style.color = '#ff6b6b';
    } else {
        usedEl.style.color = 'var(--accent-color)';
    }

    document.getElementById('days-off').textContent = totalOff;
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
 * Renders the full calendar view.
 */
function renderCalendar() {
    const container = document.getElementById('calendar');
    container.innerHTML = '';

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

            const type = getDayType(date);
            if (type === 'weekend') el.classList.add('weekend');

            const holidayName = getHolidayName(date);
            if (holidayName) {
                el.classList.add('holiday');
                el.title = holidayName;
            }

            if (bookedDates.has(dateStr)) {
                el.classList.add('leave');
            }

            if (type === 'workday') {
                el.style.cursor = 'pointer';
                el.addEventListener('click', () => {
                    if (bookedDates.has(dateStr)) {
                        bookedDates.delete(dateStr);
                    } else {
                        bookedDates.add(dateStr);
                    }
                    updateUI();
                    saveState();
                });
            }

            grid.appendChild(el);
        }

        monthDiv.appendChild(grid);
        container.appendChild(monthDiv);
    });
}

// Initialize application with error handling
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
