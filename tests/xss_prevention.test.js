const { renderCustomHolidays, setTestState } = require('../public/app.js');

describe('Security: Stored DOM XSS Prevention in Custom Holidays', () => {

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = '<div id="custom-holidays-list"></div>';
        // Reset state
        setTestState(2023, 'england-wales', [], []);
    });

    test('should prevent XSS by escaping HTML tags in holiday names', () => {
        const maliciousName = '<img src=x onerror=alert(1)>';
        const maliciousHoliday = { date: '2023-01-01', name: maliciousName, isCustom: true };

        // Set the malicious holiday
        setTestState(2023, 'england-wales', [maliciousHoliday], []);

        // Render the holidays
        renderCustomHolidays();

        const container = document.getElementById('custom-holidays-list');
        const renderedHTML = container.innerHTML;
        const renderedText = container.textContent;

        // Verify that the script tag is NOT present as HTML (escaped)
        expect(renderedHTML).not.toContain('<img src=x onerror=alert(1)>');
        expect(renderedHTML).toContain('&lt;img src=x onerror=alert(1)&gt;');

        // Verify that the text content IS present (proving textContent was used)
        expect(renderedText).toContain(maliciousName);
    });

    test('should handle valid custom holidays correctly', () => {
        const safeHoliday = { date: '2023-01-01', name: 'Safe Holiday', isCustom: true };
        setTestState(2023, 'england-wales', [safeHoliday], []);

        renderCustomHolidays();

        const container = document.getElementById('custom-holidays-list');
        expect(container.textContent).toContain('Safe Holiday (2023-01-01)');
        expect(container.innerHTML).toContain('Safe Holiday (2023-01-01)');
    });
});
