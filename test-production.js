#!/usr/bin/env node

/**
 * Quick Production Testing Script
 * Run this before deploying to production
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting Production Testing...\n');

const tests = [
    {
        name: '1. Security Audit',
        command: 'npm audit --production',
        critical: true
    },
    {
        name: '2. Type Check',
        command: 'npx tsc --noEmit',
        critical: true
    },
    {
        name: '3. Build Test',
        command: 'npm run build',
        critical: true
    },
    {
        name: '4. Lighthouse Performance',
        command: 'npx lighthouse http://localhost:4173 --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=./test-report.json --chrome-flags="--headless"',
        critical: false,
        requiresServer: true
    }
];

let passed = 0;
let failed = 0;

for (const test of tests) {
    console.log(`\n📋 Running: ${test.name}`);
    console.log(`   Command: ${test.command.substring(0, 60)}...`);

    try {
        if (test.requiresServer) {
            console.log('   ⚠️  Note: This test requires preview server running (npm run preview)');
        }

        execSync(test.command, { stdio: 'inherit' });
        console.log(`   ✅ PASSED`);
        passed++;
    } catch (error) {
        console.log(`   ❌ FAILED`);
        failed++;

        if (test.critical) {
            console.log(`   🚨 CRITICAL TEST FAILED - Fix before deployment!`);
        }
    }
}

console.log('\n' + '='.repeat(50));
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
    console.log('\n✅ All tests passed! Ready for production.\n');
    process.exit(0);
} else {
    console.log('\n⚠️  Some tests failed. Review and fix before deployment.\n');
    process.exit(1);
}
