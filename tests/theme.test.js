/** @jest-environment jsdom */

const {
    THEME_STORAGE_KEY,
    applyTheme,
    getStoredTheme,
    initTheme,
    toggleTheme
} = require('../public/theme.js');

describe('theme preference', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.removeAttribute('data-theme');
        document.body.innerHTML = `
            <button id="theme-toggle" type="button">
                <span class="theme-icon" aria-hidden="true"></span>
            </button>
        `;
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('applies a theme and exposes the opposite action accessibly', () => {
        applyTheme('dark');

        const button = document.getElementById('theme-toggle');
        expect(document.documentElement.dataset.theme).toBe('dark');
        expect(button.getAttribute('aria-label')).toBe('Switch to light theme');
        expect(button.title).toBe('Switch to light theme');
        expect(button.querySelector('.theme-icon').textContent).toBe('☀');
    });

    test('toggles and persists the manual preference', () => {
        applyTheme('light');

        expect(toggleTheme()).toBe('dark');
        expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
        expect(getStoredTheme()).toBe('dark');
    });

    test('restores a saved preference and binds the control once', () => {
        localStorage.setItem(THEME_STORAGE_KEY, 'dark');
        initTheme();
        initTheme();

        document.getElementById('theme-toggle').click();

        expect(document.documentElement.dataset.theme).toBe('light');
        expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    });

    test('follows the system theme until a manual preference is saved', () => {
        const originalMatchMedia = window.matchMedia;
        window.matchMedia = jest.fn().mockReturnValue({
            matches: true,
            addEventListener: jest.fn()
        });

        try {
            initTheme();
            expect(document.documentElement.dataset.theme).toBe('dark');
            expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
        } finally {
            window.matchMedia = originalMatchMedia;
        }
    });

    test('ignores an unsupported saved value', () => {
        localStorage.setItem(THEME_STORAGE_KEY, 'sepia');

        expect(getStoredTheme()).toBeNull();
    });
});
