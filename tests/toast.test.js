/**
 * @jest-environment jsdom
 */

const { showToast } = require('../public/app.js');

describe('showToast DOM Updates', () => {
    let container;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();

        document.body.innerHTML = '<div id="toast-container"></div>';
        container = document.getElementById('toast-container');

        // Spy on DOM methods
        jest.spyOn(document, 'getElementById');
        jest.spyOn(document, 'createElement');
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
        document.body.innerHTML = '';
    });

    test('should create and append a toast with default type (info)', () => {
        const message = 'Test info message';
        showToast(message);

        expect(document.getElementById).toHaveBeenCalledWith('toast-container');
        expect(document.createElement).toHaveBeenCalledWith('div');

        const appendedToast = container.lastElementChild;
        expect(appendedToast).not.toBeNull();
        expect(appendedToast.className).toContain('toast info');
        expect(appendedToast.textContent).toBe('ℹ️ ' + message);
    });

    test('should create and append a success toast', () => {
        const message = 'Success message';
        showToast(message, 'success');

        const appendedToast = container.lastElementChild;
        expect(appendedToast.className).toContain('toast success');
        expect(appendedToast.textContent).toBe('✅ ' + message);
    });

    test('should create and append an error toast', () => {
        const message = 'Error message';
        showToast(message, 'error');

        const appendedToast = container.lastElementChild;
        expect(appendedToast.className).toContain('toast error');
        expect(appendedToast.textContent).toBe('⚠️ ' + message);
    });

    test('should do nothing if toast-container is missing', () => {
        document.body.innerHTML = '';
        const message = 'No container message';

        showToast(message);

        expect(document.createElement).not.toHaveBeenCalled();
    });

    test('should remove the toast after timeout and animationend', () => {
        const message = 'Ephemeral message';
        showToast(message);

        const toast = container.lastElementChild;
        expect(container.contains(toast)).toBe(true);

        // Fast-forward 3 seconds
        jest.advanceTimersByTime(3000);

        // Check if toast-out class was added
        expect(toast.classList.contains('toast-out')).toBe(true);

        // Trigger animationend callback
        toast.dispatchEvent(new Event('animationend'));

        // Verify toast is removed
        expect(container.contains(toast)).toBe(false);
    });
});
