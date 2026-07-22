let getUsFederalHolidays;

beforeAll(async () => {
    ({ getUsFederalHolidays } = await import('../lib/us_federal_holidays.mjs'));
});

describe('U.S. federal holiday fallback', () => {
    test('matches the 2027 schedule and includes the next New Year observance in the calendar year', () => {
        const holidays = getUsFederalHolidays(2027);

        expect(holidays).toEqual(expect.arrayContaining([
            expect.objectContaining({ date: '2027-01-01', name: "New Year's Day" }),
            expect.objectContaining({ date: '2027-01-18', name: 'Birthday of Martin Luther King, Jr.' }),
            expect.objectContaining({ date: '2027-02-15', name: "Washington's Birthday" }),
            expect.objectContaining({ date: '2027-05-31', name: 'Memorial Day' }),
            expect.objectContaining({ date: '2027-06-18', name: 'Juneteenth National Independence Day' }),
            expect.objectContaining({ date: '2027-07-05', name: 'Independence Day' }),
            expect.objectContaining({ date: '2027-09-06', name: 'Labor Day' }),
            expect.objectContaining({ date: '2027-10-11', name: 'Columbus Day' }),
            expect.objectContaining({ date: '2027-11-11', name: 'Veterans Day' }),
            expect.objectContaining({ date: '2027-11-25', name: 'Thanksgiving Day' }),
            expect.objectContaining({ date: '2027-12-24', name: 'Christmas Day' })
        ]));
        expect(holidays
            .filter(holiday => holiday.name === "New Year's Day")
            .map(holiday => holiday.date)
        ).toEqual(['2027-01-01', '2027-12-31']);
    });

    test('uses Friday and Monday observance for fixed-date weekend holidays', () => {
        const holidays = getUsFederalHolidays(2026);

        expect(holidays).toEqual(expect.arrayContaining([
            expect.objectContaining({ date: '2026-07-03', name: 'Independence Day' }),
            expect.objectContaining({ date: '2026-12-25', name: 'Christmas Day' })
        ]));
        expect(holidays).not.toEqual(expect.arrayContaining([
            expect.objectContaining({ date: '2026-07-04', name: 'Independence Day' })
        ]));
    });
});
