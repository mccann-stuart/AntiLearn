import { buildHolidayDataset } from './lib/holiday_dataset_builder.mjs';

async function mockFetch(url) {
    return new Promise(resolve => {
        setTimeout(() => resolve({ response: { holidays: [] }, holidays: [] }), 100);
    });
}

const start = Date.now();
await buildHolidayDataset({
    fetchJson: mockFetch,
    apiKey: 'test',
    logger: { log: () => {}, warn: () => {}, error: () => {} },
    years: [2024, 2025, 2026, 2027, 2028, 2029] // 6 years
});
console.log(`Time taken: ${Date.now() - start}ms`);
