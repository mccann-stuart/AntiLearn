1. **Optimize array allocation in getUKHolidays and getHolidaysForYear**
   - In `public/app.js`, modify `getUKHolidays` by replacing `new Set(holidays.map(h => h.date))` and `customHolidays.forEach` with a native `for` loop to avoid intermediate array allocation.
   - Modify `getHolidaysForYear` similarly, by replacing `new Set(holidays.map(...))` and `new Map(holidays.map(...))` with manual loops.
2. **Run tests**
   - Run the test suite (`pnpm test`) to ensure everything works correctly after the changes.
3. **Complete pre-commit steps**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
4. **Create PR**
   - Submit the changes using the title `⚡ Bolt: [performance improvement]`.
