(function () {
    'use strict';

    const THEME_STORAGE_KEY = 'vacationMaximiserTheme';
    const LIGHT_THEME = 'light';
    const DARK_THEME = 'dark';

    function getSystemTheme() {
        return typeof window.matchMedia === 'function'
            && window.matchMedia('(prefers-color-scheme: dark)').matches
            ? DARK_THEME
            : LIGHT_THEME;
    }

    function getStoredTheme() {
        try {
            const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
            return storedTheme === LIGHT_THEME || storedTheme === DARK_THEME
                ? storedTheme
                : null;
        } catch (error) {
            console.warn('Unable to read the saved theme preference:', error);
            return null;
        }
    }

    function updateThemeControl(theme) {
        const button = document.getElementById('theme-toggle');
        if (!button) return;

        const targetTheme = theme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
        const label = `Switch to ${targetTheme} theme`;
        const icon = button.querySelector('.theme-icon');

        button.setAttribute('aria-label', label);
        button.title = label;
        if (icon) {
            icon.textContent = targetTheme === DARK_THEME ? '☾' : '☀';
        }
    }

    function applyTheme(theme) {
        const safeTheme = theme === DARK_THEME ? DARK_THEME : LIGHT_THEME;
        document.documentElement.dataset.theme = safeTheme;
        updateThemeControl(safeTheme);
        return safeTheme;
    }

    function saveTheme(theme) {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch (error) {
            console.warn(`Unable to save the '${theme}' theme preference:`, error);
        }
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.dataset.theme || getSystemTheme();
        const nextTheme = currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
        saveTheme(nextTheme);
        return applyTheme(nextTheme);
    }

    function bindThemeControl() {
        const button = document.getElementById('theme-toggle');
        if (!button || button.dataset.themeBound === 'true') return;

        button.dataset.themeBound = 'true';
        button.addEventListener('click', toggleTheme);
        updateThemeControl(document.documentElement.dataset.theme || getSystemTheme());
    }

    function initTheme() {
        const storedTheme = getStoredTheme();
        applyTheme(storedTheme || getSystemTheme());

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', bindThemeControl, { once: true });
        } else {
            bindThemeControl();
        }

        if (!storedTheme && typeof window.matchMedia === 'function') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
            const handleSystemThemeChange = (event) => {
                if (!getStoredTheme()) {
                    applyTheme(event.matches ? DARK_THEME : LIGHT_THEME);
                }
            };

            if (typeof systemTheme.addEventListener === 'function') {
                systemTheme.addEventListener('change', handleSystemThemeChange);
            }
        }
    }

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        initTheme();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            THEME_STORAGE_KEY,
            applyTheme,
            getStoredTheme,
            getSystemTheme,
            initTheme,
            toggleTheme
        };
    }
}());
