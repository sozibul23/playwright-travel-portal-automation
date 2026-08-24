import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

// ─────────────────────────────────────────────────────────────────────────
// Ordered execution pipeline
// ─────────────────────────────────────────────────────────────────────────
// প্রতিটা project একটা stage। workers:1 + fullyParallel:false থাকায়
// Playwright প্রতিটা project (STAGES array-এ যে ক্রমে লেখা) সম্পূর্ণ
// শেষ করেই পরেরটায় যায়। Stage ৩ থেকে ৬ পর্যন্ত '01-auth-login' এর উপর
// depend করে, কিন্তু নিজেদের মধ্যে কোনো sequential dependencies chain নেই।
//
// আগে এখানে sequential dependencies চেইন ছিল (fail-fast pipeline: এক stage
// fail করলে পরের সব skip)। সেটা সরিয়ে দেওয়া হয়েছে যাতে একটা negative
// test fail করলেও বাকি সব stage (validation, commission, e2e,
// regression, ui) ঠিকই রান হয় এবং পুরো coverage রিপোর্টে দেখা যায়।
// ─────────────────────────────────────────────────────────────────────────

const chrome = { ...devices['Desktop Chrome'] };
const firefox = { ...devices['Desktop Firefox'] };

const envBrowser = process.env.BROWSER ? process.env.BROWSER.trim().toLowerCase() : 'chromium';
const baseDevice = envBrowser === 'firefox' ? firefox : chrome;

const STAGES = [
  // Layer 1: Authentication & Login
  { name: '01-auth-login', testMatch: 'flights/01-auth.spec.js' },

  // Layer 2: Flight Search Form (Inputs, validations, boundaries)
  { name: '02-flight-search-form', testMatch: 'flights/02-search.spec.js' },

  // Layer 3: Flight Information & Duration
  { name: '03-flight-info', testMatch: 'flights/03-flightInfo.spec.js' },

  // Layer 4: Flight Results Filters & Sorting
  { name: '04-flight-filters', testMatch: 'flights/04-filters.spec.js' },

  // Layer 5: Flight Pricing & Commission
  { name: '05-flight-pricing', testMatch: 'flights/05-pricing.spec.js' },

  // Layer 6: End-to-End Flight Booking Flows
  { name: '06-flight-booking', testMatch: 'flights/06-booking.spec.js' },

  // Layer 7: Ticket Issuance, Voiding & Post-booking Operations
  { name: '07-flight-ticketing', testMatch: 'flights/07-ticketing.spec.js' },
];

const envSupplier = process.env.SUPPLIER ? process.env.SUPPLIER.trim().toLowerCase() : '';

const suppliers = [
  { name: 'supplier-atlas', key: 'atlas', displayName: 'Atlas SandBox - TripGic' },
  { name: 'supplier-travelrobot', key: 'travelrobot', displayName: 'TravelRobotFlight-Sandbox' },
  { name: 'supplier-yuehang', key: 'yuehang', displayName: 'yuehang test' }
];

let projects = [];

if (envSupplier) {
  const activeSuppliers = suppliers.filter(s => s.displayName.toLowerCase() === envSupplier || s.key === envSupplier);
  if (activeSuppliers.length === 0) {
    activeSuppliers.push({
      name: `supplier-${envSupplier.replace(/\s+/g, '-').toLowerCase()}`,
      key: envSupplier,
      displayName: process.env.SUPPLIER
    });
  }
  projects = activeSuppliers.map(sup => ({
    name: sup.name,
    testMatch: 'flights/**/*.spec.js',
    testIgnore: '**/01-auth.spec.js',
    use: { 
      ...baseDevice, 
      supplierKey: sup.key, 
      supplierName: sup.displayName 
    },
  }));
} else {
  // Standard pipeline stages (Layer 1 to Layer 7) - Runs each test exactly ONCE
  projects = STAGES.map((stage) => ({
    name: stage.name,
    testMatch: stage.testMatch,
    use: baseDevice,
  }));

  // Dedicated Chrome project for Flight tests
  projects.push({
    name: 'chrome',
    testMatch: 'flights/**/*.spec.js',
    use: {
      ...chrome,
    },
  });

  // Dedicated Firefox project for Flight tests
  projects.push({
    name: 'firefox',
    testMatch: 'flights/**/*.spec.js',
    use: {
      ...firefox,
    },
  });

  // ── Hotel Projects ────────────────────────────────────────────────────
  // Split into 3 tiers: smoke (CI), regression (weekly), e2e (release).
  // debug_*.spec.js are excluded everywhere.

  // 🔥 Smoke — Fast CI check on every deploy (~5 min, 2 tests)
  projects.push({
    name: 'hotel-smoke',
    testMatch: ['hotels/smoke/**/*.spec.js'],
    testIgnore: ['**/debug_*.spec.js'],
    use: { ...chrome },
    retries: 1,
  });

  // 🔄 Regression — Full weekly suite with all tagged tests
  projects.push({
    name: 'hotel-regression',
    testMatch: ['hotels/regression/**/*.spec.js'],
    testIgnore: ['**/debug_*.spec.js'],
    use: {
      ...chrome,
      video: 'retain-on-failure',
      screenshot: 'only-on-failure',
      trace: 'retain-on-failure',
    },
    retries: 2,          // Handles supplier rate expiry flakiness
    timeout: 480000,     // 8 min per test (occupancy tests are slow)
  });

  // 🚀 E2E — Happy path end-to-end suite
  projects.push({
    name: 'hotel-e2e',
    testMatch: ['hotels/e2e/**/*.spec.js'],
    testIgnore: ['**/debug_*.spec.js'],
    use: { ...chrome },
    retries: 1,
  });

  // 🏷️ Tag-based hotel projects (grep shortcuts)
  // hotel-critical: @critical tests from regression + e2e + smoke
  projects.push({
    name: 'hotel-critical',
    testMatch: ['hotels/**/*.spec.js'],
    testIgnore: ['**/debug_*.spec.js'],
    grep: /@critical/,
    use: { ...chrome },
    retries: 1,
  });

  // hotel-flaky: @flaky tests only (large occupancy groups)
  projects.push({
    name: 'hotel-flaky',
    testMatch: ['hotels/regression/**/*.spec.js'],
    testIgnore: ['**/debug_*.spec.js'],
    grep: /@flaky/,
    use: { ...chrome },
    retries: 3,          // Extra retries for known-flaky supplier tests
    timeout: 480000,
  });

  // 🌐 Dedicated B2C Project
  projects.push({
    name: 'b2c',
    testMatch: 'b2c/**/*.spec.js',
    use: {
      ...chrome,
      baseURL: process.env.B2C_BASE_URL || 'https://b2c.innovatedemo.com',
    },
  });

  // Backwards-compat alias — 'hotel' runs all 3 tiers
  projects.push({
    name: 'hotel',
    testMatch: ['hotels/smoke/**/*.spec.js', 'hotels/regression/**/*.spec.js', 'hotels/e2e/**/*.spec.js'],
    testIgnore: ['**/debug_*.spec.js'],
    use: { ...chrome },
    retries: 1,
  });

  // Add dynamic supplier projects for BOTH Chromium & Firefox for EVERY supplier (No hardcoding)
  for (const sup of suppliers) {
    // Default supplier project (uses BROWSER env var if set, otherwise default baseDevice)
    projects.push({
      name: sup.name,
      testMatch: 'flights/**/*.spec.js',
      testIgnore: '**/01-auth.spec.js',
      use: { 
        ...baseDevice, 
        supplierKey: sup.key, 
        supplierName: sup.displayName 
      },
    });

    // Explicit Chrome supplier project
    projects.push({
      name: `${sup.name}-chrome`,
      testMatch: 'flights/**/*.spec.js',
      testIgnore: '**/01-auth.spec.js',
      use: { 
        ...chrome, 
        supplierKey: sup.key, 
        supplierName: sup.displayName 
      },
    });

    // Explicit Firefox supplier project
    projects.push({
      name: `${sup.name}-firefox`,
      testMatch: 'flights/**/*.spec.js',
      testIgnore: '**/01-auth.spec.js',
      use: { 
        ...firefox, 
        supplierKey: sup.key, 
        supplierName: sup.displayName 
      },
    });
  }
}

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: { timeout: 10000 },

  // debug/exploration script tests/ এর বাইরে সরানো হয়েছে (debug/ ফোল্ডারে),
  // এই testIgnore শুধু defense-in-depth হিসেবে রাখা।
  testIgnore: ['**/*.debug.js', '**/debug/**'],

  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.WORKERS ? parseInt(process.env.WORKERS) : 1,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html-report', open: 'never' }],
    ['allure-playwright', { detail: true, outputFolder: 'allure-results' }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'https://b2b.innovatedemo.com',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
  },

  projects,
});
