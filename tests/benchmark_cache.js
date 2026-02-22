
const app = require('../public/app.js');

const {
    setTestState,
    findOptimalPlan
} = app;

function runBenchmark() {
    const year1 = 2024;
    const year2 = 2025;
    const allowance = 25;
    const region = 'england-wales';

    // Set up state
    setTestState(year1, region, [], [], 'sat-sun', allowance);

    const iterations = 1000;

    // SCENARIO 1: Cache Miss / Thrashing (Alternating Years)
    console.log("Scenario 1: Alternating Years (Cache Thrashing)");
    const start1 = process.hrtime();
    for (let i = 0; i < iterations; i++) {
        findOptimalPlan(year1, allowance);
        findOptimalPlan(year2, allowance);
    }
    const [sec1, nano1] = process.hrtime(start1);
    const ms1 = sec1 * 1000 + nano1 / 1e6;
    console.log(`Total time: ${ms1.toFixed(2)}ms`);
    console.log(`Avg per call: ${(ms1 / (iterations * 2)).toFixed(4)}ms`);

    // SCENARIO 2: Cache Hit (Sequential Years)
    console.log("\nScenario 2: Sequential Years (Cache Hit)");
    // Reset cache just to be sure we start fresh-ish (though ensureDayTypeCache handles it)
    setTestState(year1, region, [], [], 'sat-sun', allowance);

    const start2 = process.hrtime();
    // Run year1 repeatedly
    for (let i = 0; i < iterations; i++) {
        findOptimalPlan(year1, allowance);
    }
    // Run year2 repeatedly
    for (let i = 0; i < iterations; i++) {
        findOptimalPlan(year2, allowance);
    }
    const [sec2, nano2] = process.hrtime(start2);
    const ms2 = sec2 * 1000 + nano2 / 1e6;
    console.log(`Total time: ${ms2.toFixed(2)}ms`);
    console.log(`Avg per call: ${(ms2 / (iterations * 2)).toFixed(4)}ms`);

    // Comparison
    const diff = ms1 - ms2;
    console.log(`\nPerformance Gap (Cache Miss Overhead): ${diff.toFixed(2)}ms total over ${iterations * 2} calls`);
    console.log(`Overhead per call: ${(diff / (iterations * 2)).toFixed(4)}ms`);
}

runBenchmark();
