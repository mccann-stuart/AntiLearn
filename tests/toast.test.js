/** @jest-environment jsdom */
const { showToast } = require('../public/app.js');

describe('showToast DOM Updates', () => {
    let container;

    beforeEach(() => {
        jest.useFakeTimers();
        document.body.innerHTML = '<div id="toast-container"></div>';
        container = document.getElementById('toast-container');
    });

    afterEach(() => {
        jest.useRealTimers();
        document.body.innerHTML = '';
    });

    test('should create and append a toast with default type (info)', () => {
        const message = 'Test info message';
        showToast(message);

        const toasts = container.querySelectorAll('.toast');
        expect(toasts.length).toBe(1);
        expect(toasts[0].className).toContain('toast info');
        expect(toasts[0].textContent).toBe('ℹ️ ' + message);
    });

    test('should create and append a success toast', () => {
        const message = 'Success message';
        showToast(message, 'success');

        const toasts = container.querySelectorAll('.toast');
        expect(toasts.length).toBe(1);
        expect(toasts[0].className).toContain('toast success');
        expect(toasts[0].textContent).toBe('✅ ' + message);
    });

    test('should create and append an error toast', () => {
        const message = 'Error message';
        showToast(message, 'error');

        const toasts = container.querySelectorAll('.toast');
        expect(toasts.length).toBe(1);
        expect(toasts[0].className).toContain('toast error');
        expect(toasts[0].textContent).toBe('⚠️ ' + message);
    });

    test('should do nothing if toast-container is missing', () => {
        document.body.innerHTML = ''; // Remove container
        const message = 'No container message';

        showToast(message);

        expect(document.querySelectorAll('.toast').length).toBe(0);
    });

    test('should remove the toast after timeout and animationend', () => {
        const message = 'Ephemeral message';
        showToast(message);

        const toasts = container.querySelectorAll('.toast');
        expect(toasts.length).toBe(1);
        const toast = toasts[0];

        // Fast-forward 3 seconds
        jest.advanceTimersByTime(3000);

        // Check if toast-out class was added
        expect(toast.classList.contains('toast-out')).toBe(true);

        // Trigger animationend event
        toast.dispatchEvent(new Event('animationend'));

        // Verify toast is removed
        expect(container.querySelectorAll('.toast').length).toBe(0);
    });
});
