const { showToast } = require('../public/app.js');

describe('showToast DOM Updates', () => {
    let container;

    // Manual mocks for DOM elements and methods
    const mockDocument = {
        getElementById: jest.fn(),
        createElement: jest.fn()
    };

    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();

        // Setup container mock
        container = {
            appendChild: jest.fn(),
            removeChild: jest.fn(),
            contains: jest.fn(),
            children: []
        };

        // Mock global document
        jest.spyOn(document, "getElementById").mockImplementation(mockDocument.getElementById);
        jest.spyOn(document, "createElement").mockImplementation(mockDocument.createElement);
        if (document.createTextNode) jest.spyOn(document, "createTextNode").mockImplementation(text => ({ textContent: text }));
        mockDocument.getElementById.mockReturnValue(container);

        // Mock createElement to return a rich mock object
        mockDocument.createElement.mockImplementation((tag) => {
            const el = {
                tagName: tag.toUpperCase(),
                className: '',
                textContent: '',
                classList: {
                    add: jest.fn((cls) => {
                        el.className += ' ' + cls;
                    }),
                    contains: jest.fn((cls) => el.className.includes(cls))
                },
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                setAttribute: jest.fn(),
                appendChild: jest.fn((child) => {
                    if (child.textContent) {
                        el.textContent += child.textContent;
                    } else if (child.nodeType === 3) {
                        el.textContent += child.nodeValue;
                    }
                })
            };
            return el;
        });
    });

    afterEach(() => {
        jest.useRealTimers();
        delete global.document;
    });

    test('should create and append a toast with default type (info)', () => {
        const message = 'Test info message';
        showToast(message);

        expect(mockDocument.getElementById).toHaveBeenCalledWith('toast-container');
        expect(mockDocument.createElement).toHaveBeenCalledWith('div');

        expect(container.appendChild).toHaveBeenCalled();

        const appendedToast = container.appendChild.mock.calls[0][0];
        expect(appendedToast.className).toContain('toast info');
        expect(appendedToast.textContent).toBe('ℹ️ ' + message);
    });

    test('should create and append a success toast', () => {
        const message = 'Success message';
        showToast(message, 'success');

        const appendedToast = container.appendChild.mock.calls[0][0];
        expect(appendedToast.className).toContain('toast success');
        expect(appendedToast.textContent).toBe('✅ ' + message);
    });

    test('should create and append an error toast', () => {
        const message = 'Error message';
        showToast(message, 'error');

        const appendedToast = container.appendChild.mock.calls[0][0];
        expect(appendedToast.className).toContain('toast error');
        expect(appendedToast.textContent).toBe('⚠️ ' + message);
    });

    test('should do nothing if toast-container is missing', () => {
        mockDocument.getElementById.mockReturnValue(null);
        const message = 'No container message';

        showToast(message);

        const createdDivs = mockDocument.createElement.mock.calls.filter(call => call[0] === 'div');
        expect(createdDivs.length).toBe(0);
    });

    test('should remove the toast after timeout and animationend', () => {
        const message = 'Ephemeral message';
        showToast(message);

        const toast = container.appendChild.mock.calls[0][0];

        // Fast-forward 3 seconds
        jest.advanceTimersByTime(3000);

        // After 3 seconds, addEventListener should have been called
        expect(toast.addEventListener).toHaveBeenCalledWith('animationend', expect.any(Function));

        // Get the callback passed to addEventListener
        const animationEndCallback = toast.addEventListener.mock.calls[0][1];

        // Check if toast-out class was added
        expect(toast.classList.add).toHaveBeenCalledWith('toast-out');

        // Trigger animationend callback
        container.contains.mockReturnValue(true);
        animationEndCallback();

        // Verify toast is removed
        expect(container.removeChild).toHaveBeenCalledWith(toast);
    });
});
