/**
 * UK Vacation Maximiser Logic
 * Combined into one file to ensure it runs locally without a server.
 */

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
 * Generates a list of UK bank holidays for a given year.
 * Handles substitute days for holidays falling on weekends.
 * @param {number} year The year to generate holidays for.
 * @returns {Array<{date: string, name: string}>} A list of holiday objects.
 */
function getUKHolidays(year) {
    const holidays = [];

    // 1. New Year's Day (Jan 1)
    // Substitute: If Sat/Sun, next Mon
    let newYear = new Date(year, 0, 1);
    if (newYear.getDay() === 0) newYear = new Date(year, 0, 2); // Sun -> Mon
    else if (newYear.getDay() === 6) newYear = new Date(year, 0, 3); // Sat -> Mon
    holidays.push({ date: toLocalISOString(newYear), name: "New Year's Day" });

    // 2. Good Friday (Easter - 2)
    const easter = getEasterDate(year);
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    holidays.push({ date: toLocalISOString(goodFriday), name: "Good Friday" });

    // 3. Easter Monday (Easter + 1)
    const easterMonday = new Date(easter);
    easterMonday.setDate(easter.getDate() + 1);
    holidays.push({ date: toLocalISOString(easterMonday), name: "Easter Monday" });

    // 4. Early May Bank Holiday (First Monday in May)
    let mayDay = new Date(year, 4, 1);
    while (mayDay.getDay() !== 1) {
        mayDay.setDate(mayDay.getDate() + 1);
    }
    holidays.push({ date: toLocalISOString(mayDay), name: "Early May Bank Holiday" });

    // 5. Spring Bank Holiday (Last Monday in May)
    let springBank = new Date(year, 4, 31);
    while (springBank.getDay() !== 1) {
        springBank.setDate(springBank.getDate() - 1);
    }
    holidays.push({ date: toLocalISOString(springBank), name: "Spring Bank Holiday" });

    // 6. Summer Bank Holiday (Last Monday in August)
    let summerBank = new Date(year, 7, 31);
    while (summerBank.getDay() !== 1) {
        summerBank.setDate(summerBank.getDate() - 1);
    }
    holidays.push({ date: toLocalISOString(summerBank), name: "Summer Bank Holiday" });

    // 7. Christmas Day (Dec 25)
    let xmas = new Date(year, 11, 25);
    let xmasSub = null;
    if (xmas.getDay() === 6) xmasSub = new Date(year, 11, 27);
    else if (xmas.getDay() === 0) xmasSub = new Date(year, 11, 27);

    if (xmasSub) {
        holidays.push({ date: toLocalISOString(xmasSub), name: "Christmas Day (Substitute)" });
    } else {
        holidays.push({ date: toLocalISOString(xmas), name: "Christmas Day" });
    }

    // 8. Boxing Day (Dec 26)
    let boxing = new Date(year, 11, 26);
    let boxingSub = null;
    if (boxing.getDay() === 6) boxingSub = new Date(year, 11, 28);
    else if (boxing.getDay() === 0) boxingSub = new Date(year, 11, 28);

    if (boxingSub) {
        holidays.push({ date: toLocalISOString(boxingSub), name: "Boxing Day (Substitute)" });
    } else {
        holidays.push({ date: toLocalISOString(boxing), name: "Boxing Day" });
    }

    return holidays;
}

// Cache holidays for performance
const holidaysCache = new Map();

/**
 * Retrieves UK bank holidays for a given year, using a cache to avoid re-computation.
 * @param {number} year The year to get holidays for.
 * @returns {Array<{date: string, name: string}>} A list of holiday objects.
 */
function getHolidaysForYear(year) {
    if (!holidaysCache.has(year)) {
        holidaysCache.set(year, getUKHolidays(year));
    }
    return holidaysCache.get(year);
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
 * Checks if a given date is a UK bank holiday.
 * @param {Date} date The date to check.
 * @returns {boolean} True if the date is a holiday.
 */
function isHoliday(date) {
    const year = date.getFullYear();
    const holidays = getHolidaysForYear(year);
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
    const holidays = getHolidaysForYear(year);
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
 * @param {Date} startDate The proposed start date for booking leave.
 * @param {number} leaveDaysToUse The number of workdays to book as leave.
 * @returns {{startDate: Date, endDate: Date, leaveDaysUsed: number, totalDaysOff: number, efficiency: number, bookedDates: Array<Date>}|null} An object detailing the leave block, or null if no valid block could be created.
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
 * It prioritizes using the full allowance and then maximizing the total time off.
 * @param {number} year The year to plan for.
 * @param {number} allowance The total number of leave days available.
 * @returns {Array<{startDate: Date, endDate: Date, leaveDaysUsed: number, totalDaysOff: number, efficiency: number, bookedDates: Array<Date>}>} A sorted array of the best leave blocks found.
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

    // Strategy: Mix high efficiency blocks with long duration blocks
    // 1. Get top efficient blocks
    const sortedByEfficiency = [...uniqueCandidates].sort((a, b) => b.efficiency - a.efficiency);
    const efficientCandidates = sortedByEfficiency.slice(0, 100); // Increased pool

    // 2. Get top longest blocks (to help fill allowance)
    const sortedByDuration = [...uniqueCandidates].sort((a, b) => b.totalDaysOff - a.totalDaysOff);
    const longCandidates = sortedByDuration.slice(0, 50); // Increased pool

    // Combine and deduplicate again
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

    // Sort by efficiency for the main loop logic (it prefers earlier items in the list)
    finalCandidates.sort((a, b) => b.efficiency - a.efficiency);

    const topCandidates = finalCandidates;

    // 2. Find best combination of 3 blocks
    let bestCombo = [];
    let maxScore = -1;

    function getScore(c1, c2, c3) {
        const totalLeave = (c1 ? c1.leaveDaysUsed : 0) + (c2 ? c2.leaveDaysUsed : 0) + (c3 ? c3.leaveDaysUsed : 0);
        const totalOff = (c1 ? c1.totalDaysOff : 0) + (c2 ? c2.totalDaysOff : 0) + (c3 ? c3.totalDaysOff : 0);

        // Primary goal: Use as much allowance as possible (weight: 1000 per day)
        // Secondary goal: Maximize days off (weight: 1 per day)
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

    // If still empty, try 1
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
 * @param {object} b1 The first leave block.
 * @param {object} b2 The second leave block.
 * @returns {boolean} True if the blocks overlap.
 */
function overlap(b1, b2) {
    return b1.startDate <= b2.endDate && b1.endDate >= b2.startDate;
}

// --- MAIN UI ---

let currentAllowance = 25;
let currentYear = new Date().getFullYear();
let bookedDates = new Set();

/**
 * Initializes the application, sets up event listeners, and performs the initial render.
 */
function init() {
    const yearSelect = document.getElementById('year-select');
    if (yearSelect) {
        // Dynamically populate years (current year + 1 to 5 years forward)
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
            }
        });
    }

    document.getElementById('reset-btn').addEventListener('click', () => {
        resetToOptimal();
    });

    resetToOptimal();
    initScrollHandler();
}

/**
 * Sets up a scroll listener to handle the sticky header's appearance.
 */
function initScrollHandler() {
    const header = document.getElementById('sticky-header');
    const placeholder = document.getElementById('sticky-placeholder');
    const threshold = 100; // Scroll threshold
    let ticking = false;

    // Capture the original header height BEFORE any transformations
    let originalHeight = null;

    function handleScroll() {
        if (window.scrollY > threshold && !document.body.classList.contains('scrolled')) {
            // Capture height before it shrinks (only once on first scroll)
            if (!originalHeight) {
                originalHeight = header.offsetHeight;
            }
            placeholder.style.height = `${originalHeight}px`;
            document.body.classList.add('scrolled');
        } else if (window.scrollY <= threshold && document.body.classList.contains('scrolled')) {
            // Remove scrolled class first, then reset placeholder after a brief delay
            // This allows the header to expand back before removing the placeholder
            document.body.classList.remove('scrolled');
            setTimeout(() => {
                if (window.scrollY <= threshold) {
                    placeholder.style.height = '0';
                }
            }, 300); // Match the CSS transition duration
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
 * Resets the current plan to the optimal plan and updates the UI.
 */
function resetToOptimal() {
    const blocks = findOptimalPlan(currentYear, currentAllowance);
    bookedDates.clear();
    blocks.forEach(block => {
        block.bookedDates.forEach(d => {
            bookedDates.add(toLocalISOString(d));
        });
    });
    updateUI();
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
 * @returns {Array<object>} A sorted array of leave block objects derived from the current plan.
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
 * @param {Date} date The date to format.
 * @returns {string} The formatted date string (e.g., "5 May").
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
    // Sort blocks by date for display
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
 * Renders the full calendar view for the selected year, highlighting weekends, holidays, and booked leave days.
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
                });
            }

            grid.appendChild(el);
        }

        monthDiv.appendChild(grid);
        container.appendChild(monthDiv);
    });
}

init();
