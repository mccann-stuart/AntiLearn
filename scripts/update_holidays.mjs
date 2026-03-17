#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import {
    buildHolidayDataset as buildSharedHolidayDataset,
    fetchCalendarificHolidays as fetchCalendarificHolidaysFromBuilder,
    fetchTallyfyHolidays as fetchTallyfyHolidaysFromBuilder
} from '../lib/holiday_dataset_builder.mjs';
import { normalizeCalendarific, normalizeTallyfy, mergeHolidayLists } from '../lib/holiday_utils.mjs';
import {
    COUNTRY_LEVEL_DATASET_LOCATIONS,
    DATASET_LOCATIONS
} from '../lib/dataset_locations.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CALENDARIFIC_ENV_KEYS = [
    'calendarific',
    'CALENDARIFIC_API_KEY',
    'CALENDARIFIC_KEY',
    'CALENDARIFIC'
];
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

async function buildHolidayDataset(options = {}) {
    return buildSharedHolidayDataset({
        fetchJson: options.fetchJson || fetchJson,
        apiKey: Object.prototype.hasOwnProperty.call(options, 'apiKey')
            ? options.apiKey
            : getCalendarificApiKey(),
        logger: options.logger || console,
        years: options.years
    });
}

async function fetchCalendarificHolidays(apiKey, countryCode, year, options = {}) {
    return fetchCalendarificHolidaysFromBuilder(
        options.fetchJson || fetchJson,
        apiKey,
        {
            countryCode,
            year,
            location: options.location || '',
            types: options.types
        },
        options.logger || console
    );
}

async function fetchTallyfyHolidays(countryCode, year, options = {}) {
    return fetchTallyfyHolidaysFromBuilder(options.fetchJson || fetchJson, countryCode, year);
}

async function main() {
    console.log('Starting holiday dataset update...');
    const dataset = await buildHolidayDataset({
        apiKey: getCalendarificApiKey()
    });
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

const COUNTRIES = COUNTRY_LEVEL_DATASET_LOCATIONS;

export {
    COUNTRIES,
    DATASET_LOCATIONS,
    fetchJson,
    fetchCalendarificHolidays,
    fetchTallyfyHolidays,
    getCalendarificApiKey,
    loadEnvFile,
    buildHolidayDataset,
    normalizeCalendarific,
    normalizeTallyfy,
    mergeHolidayLists
};
