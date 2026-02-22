#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { normalizeCalendarific, normalizeTallyfy, mergeHolidayLists } from '../lib/holiday_utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CALENDARIFIC_URL = 'https://calendarific.com/api/v2/holidays';
const TALLYFY_URL = 'https://tallyfy.com/national-holidays/api';
const CALENDARIFIC_TYPES = 'national,religious';
const CALENDARIFIC_ENV_KEYS = [
    'calendarific',
    'CALENDARIFIC_API_KEY',
    'CALENDARIFIC_KEY',
    'CALENDARIFIC'
];
const COUNTRIES = [
    { code: 'QA', name: 'Qatar' },
    { code: 'AE', name: 'United Arab Emirates' }
];
const YEARS_AHEAD = 5;
const OUTPUT_PATH = path.join(__dirname, '..', '.wrangler', 'holidays.json');
const DEV_VARS_PATH = path.join(__dirname, '..', '.dev.vars');
const DOTENV_PATH = path.join(__dirname, '..', '.env');

function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    const raw = fs.readFileSync(filePath, 'utf8');
    raw.split(/\r?\n/).forEach(line => {
        let trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        if (trimmed.startsWith('export ')) {
            trimmed = trimmed.slice('export '.length).trim();
        }
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1) return;
        const key = trimmed.slice(0, eqIndex).trim();
        if (!key) return;
        let value = trimmed.slice(eqIndex + 1).trim();
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }
        if (!process.env[key]) {
            process.env[key] = value;
        }
    });
}

function loadLocalEnv() {
    loadEnvFile(DEV_VARS_PATH);
    loadEnvFile(DOTENV_PATH);
}

function getCalendarificApiKey() {
    for (const key of CALENDARIFIC_ENV_KEYS) {
        const value = process.env[key];
        if (value) return value;
    }
    return '';
}

loadLocalEnv();

function fetchJsonWithHttps(url) {
    return new Promise((resolve, reject) => {
        https
            .get(url, (res) => {
                let data = '';
                res.on('data', chunk => {
                    data += chunk;
                });
                res.on('end', () => {
                    if (res.statusCode && res.statusCode >= 400) {
                        reject(new Error(`Request failed with status ${res.statusCode}`));
                        return;
                    }
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(e);
                    }
                });
            })
            .on('error', reject);
    });
}

async function fetchJson(url) {
    if (typeof fetch === 'function') {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
        return response.json();
    }
    return fetchJsonWithHttps(url);
}

function getYearsToFetch() {
    const currentYear = new Date().getUTCFullYear();
    return Array.from({ length: YEARS_AHEAD + 1 }, (_, i) => currentYear + i);
}

async function fetchCalendarificHolidays(apiKey, countryCode, year) {
    if (!apiKey) return [];
    const url = new URL(CALENDARIFIC_URL);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('country', countryCode);
    url.searchParams.set('year', String(year));
    url.searchParams.set('type', CALENDARIFIC_TYPES);

    const data = await fetchJson(url.toString());
    return normalizeCalendarific(data && data.response ? data.response.holidays : null);
}

async function fetchTallyfyHolidays(countryCode, year) {
    const url = `${TALLYFY_URL}/${countryCode}/${year}.json`;
    const data = await fetchJson(url);
    return normalizeTallyfy(data ? data.holidays : null);
}

async function buildHolidayDataset() {
    const years = getYearsToFetch();
    const apiKey = getCalendarificApiKey();
    if (!apiKey) {
        console.warn('Warning: Calendarific API key not found. Skipping Calendarific holidays.');
    }
    const dataset = {
        generatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString().slice(0, 10),
        sources: {
            calendarific: {
                enabled: true
            },
            tallyfy: {
                enabled: true
            }
        },
        countries: {}
    };

    for (const country of COUNTRIES) {
        const yearsData = {};
        for (const year of years) {
            let calendarificList = [];
            let tallyfyList = [];
            try {
                calendarificList = await fetchCalendarificHolidays(apiKey, country.code, year);
            } catch (e) {
                let errorMessage = e.message || String(e);
                if (apiKey) {
                    errorMessage = errorMessage.replaceAll(apiKey, 'REDACTED');
                }
                console.error(`Failed to fetch Calendarific holidays for ${country.code} ${year}: ${errorMessage}`);
                calendarificList = [];
            }
            try {
                tallyfyList = await fetchTallyfyHolidays(country.code, year);
            } catch (e) {
                tallyfyList = [];
            }
            yearsData[String(year)] = mergeHolidayLists(calendarificList, tallyfyList);
        }
        console.log(`Finished processing ${country.name} (${country.code})`);

        dataset.countries[country.code] = {
            name: country.name,
            years: yearsData
        };
    }

    return dataset;
}

async function main() {
    console.log('Starting holiday dataset update...');
    const dataset = await buildHolidayDataset();
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(dataset, null, 2));
    console.log(`Holiday dataset written to ${OUTPUT_PATH}`);
}

const isDirectRun = process.argv[1]
    && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
    main().catch(err => {
        console.error('Failed to update holiday dataset:', err);
        process.exitCode = 1;
    });
}

export {
    loadEnvFile,
    getCalendarificApiKey,
    fetchJson,
    fetchCalendarificHolidays,
    buildHolidayDataset,
    COUNTRIES,
    normalizeCalendarific,
    normalizeTallyfy,
    mergeHolidayLists
};
