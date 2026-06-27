const fs = require('fs');
const path = require('path');

describe('Cloudflare deployment configuration', () => {
    test('Worker deploys must not repopulate remote holiday KV during build', () => {
        const config = fs.readFileSync(path.join(__dirname, '..', 'wrangler.toml'), 'utf8');
        const buildSection = config.match(/^\[build\](?:\r?\n(?!\[).*)*/m)?.[0] || '';

        expect(buildSection).not.toMatch(/populate-kv/);
        expect(buildSection).not.toMatch(/wrangler\s+kv/);
        expect(buildSection).not.toMatch(/--remote/);
    });

    test('manual KV population requires a Calendarific key before remote write', () => {
        const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
        const populateCommand = pkg.scripts['populate-kv'];

        expect(populateCommand).toContain('--require-calendarific');
        expect(populateCommand.indexOf('--require-calendarific')).toBeLessThan(
            populateCommand.indexOf('wrangler kv key put')
        );
    });
});
