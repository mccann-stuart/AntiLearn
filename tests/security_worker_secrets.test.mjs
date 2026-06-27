import { jest } from '@jest/globals';
import { resolveSecretBinding } from '../worker.mjs';

describe('Security: Worker Secrets', () => {
    let consoleWarnSpy;

    beforeEach(() => {
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleWarnSpy.mockRestore();
    });

    test('should log generic message on failed get(name)', async () => {
        const binding = {
            get: jest.fn().mockRejectedValue(new Error('Provider failure'))
        };

        const result = await resolveSecretBinding(binding, 'SUPER_SECRET_KEY');

        expect(result).toBe('');

        const warnCalls = consoleWarnSpy.mock.calls.map(args => args.join(' '));
        const combinedWarnings = warnCalls.join('\n');

        expect(combinedWarnings).toContain('Failed to access secret via get(name).');
        expect(combinedWarnings).not.toContain('SUPER_SECRET_KEY');
    });
});
