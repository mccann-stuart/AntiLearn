import { holidays, isHoliday, isWeekend, getHolidayName } from './holidays.js';
import { findOptimalBlocks, getDayType } from './optimizer.js';

const ALLOWANCE = 25;
const YEAR = 2025;

let currentPlan = [];

function init() {
    // Find optimal blocks
    const blocks = findOptimalBlocks(YEAR, ALLOWANCE);
    currentPlan = blocks;

    renderStats();
    renderRecommendations();
    renderCalendar();

    document.getElementById('reset-btn').addEventListener('click', () => {
        // In a real app, this might clear local storage or reset custom selections
        // For now, it just re-runs the optimizer
        init();
    });
}

function renderStats() {
    const totalUsed = currentPlan.reduce((sum, block) => sum + block.leaveDaysUsed, 0);
    const totalOff = currentPlan.reduce((sum, block) => sum + block.totalDaysOff, 0);

    document.getElementById('days-used').textContent = totalUsed;
    document.getElementById('days-off').textContent = totalOff;
}

function formatDate(date) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function renderRecommendations() {
    const container = document.getElementById('recommendations');
    container.innerHTML = '';

    currentPlan.forEach((block, index) => {
        const card = document.createElement('div');
        card.className = 'rec-card';

        const efficiency = block.efficiency.toFixed(1);

        card.innerHTML = `
            <div class="rec-badge">Option ${index + 1}</div>
            <div class="rec-dates">
                ${formatDate(block.startDate)} - ${formatDate(block.endDate)}
            </div>
            <div class="rec-details">
                <div class="detail-item">
                    <span class="detail-num">${block.leaveDaysUsed}</span>
                    <span class="detail-text">Leave Days</span>
                </div>
                <div class="detail-item">
                    <span class="detail-num">${block.totalDaysOff}</span>
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

        // Day headers
        ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(d => {
            const h = document.createElement('div');
            h.className = 'day-header';
            h.textContent = d;
            grid.appendChild(h);
        });

        // Days
        const daysInMonth = new Date(YEAR, monthIndex + 1, 0).getDate();
        const firstDay = new Date(YEAR, monthIndex, 1).getDay(); // 0 = Sunday

        // Empty slots for start of month
        for (let i = 0; i < firstDay; i++) {
            grid.appendChild(document.createElement('div'));
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(YEAR, monthIndex, d);
            const el = document.createElement('div');
            el.className = 'day';
            el.textContent = d;

            if (isWeekend(date)) el.classList.add('weekend');

            const holidayName = getHolidayName(date);
            if (holidayName) {
                el.classList.add('holiday');
                el.title = holidayName;
            }

            // Check if this day is in our plan
            // We need to check if it's a "booked leave day" specifically, or just part of the time off?
            // Let's highlight the actual booked leave days differently from the total time off?
            // For simplicity, let's highlight the booked leave days.

            let isBooked = false;
            for (const block of currentPlan) {
                // Check if date is in block.bookedDates
                // We need to compare dates properly
                const dateStr = date.toISOString().split('T')[0];
                if (block.bookedDates.some(bd => bd.toISOString().split('T')[0] === dateStr)) {
                    isBooked = true;
                    break;
                }
            }

            if (isBooked) {
                el.classList.add('leave');
            }

            grid.appendChild(el);
        }

        monthDiv.appendChild(grid);
        container.appendChild(monthDiv);
    });
}

init();
