# ✈️ Travel QA Automation Framework — B2B & B2C Enterprise Portal

[![Playwright](https://img.shields.io/badge/Playwright-v1.40+-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![JavaScript](https://img.shields.io/badge/ECMAScript-ESM-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/)
[![Allure Report](https://img.shields.io/badge/Allure-Single--File%20Report-FF7800?style=for-the-badge&logo=allure&logoColor=white)](https://allurereport.org/)
[![Browsers](https://img.shields.io/badge/Browsers-Chromium%20%7C%20Firefox-blue?style=for-the-badge)](https://playwright.dev/docs/browsers)
[![Tests](https://img.shields.io/badge/Total%20Test%20Coverage-110+%20Scenarios-purple?style=for-the-badge)](./TEST_ROADMAP.md)

An enterprise-grade, production-ready End-to-End (E2E) QA Test Automation Framework built with **Playwright**, **Page Object Model (POM)**, **Custom Dynamic Fixtures**, and **Allure Reporting**. Engineered to validate flight bookings, hotel reservations, multi-supplier integrations, and dynamic coupon/promotion engines across both **B2B** and **B2C** travel portals.

---

## 📑 Table of Contents

- [🌟 Key Architectural Highlights](#-key-architectural-highlights)
- [⚡ Quick Start & Installation](#-quick-start--installation)
- [⚙️ Environment Configuration](#️-environment-configuration)
- [🚀 Test Execution Guide](#-test-execution-guide)
  - [✈️ Flight Module Commands](#️-flight-module-commands)
  - [🏢 Multi-Supplier Matrix Commands](#-multi-supplier-matrix-commands)
  - [🎟️ Coupon Code Suite Commands (B2B + B2C)](#️-coupon-code-suite-commands-b2b--b2c)
  - [🏨 Hotel Automation Suite Commands](#-hotel-automation-suite-commands)
  - [🏷️ Tag-Based Targeted Execution](#️-tag-based-targeted-execution)
- [📂 Project Directory Structure](#-project-directory-structure)
- [🧪 Test Suite Coverage & Matrix](#-test-suite-coverage--matrix)
  - [1. B2B Flight 7-Layer Pipeline](#1-b2b-flight-7-layer-pipeline)
  - [2. Dynamic Coupon Validation Matrix (14 Scenarios)](#2-dynamic-coupon-validation-matrix-14-scenarios)
  - [3. Hotel Automation Suite (46 Tests)](#3-hotel-automation-suite-46-tests)
- [📊 Allure Reporting & Developer Sharing Workflow](#-allure-reporting--developer-sharing-workflow)
- [🔄 CI/CD Pipeline Integration](#-cicd-pipeline-integration)
- [🛡️ Engineering Best Practices & Standards](#️-engineering-best-practices--standards)
- [👨‍💻 Author & Maintainer](#-author--maintainer)

---

## 🌟 Key Architectural Highlights

- **Dual-Portal Testing Capabilities:** Seamlessly automates both the **B2B Agent Portal** (`https://b2b.innovatedemo.com`) and the **B2C Consumer Booking Portal** (`https://b2c.innovatedemo.com`).
- **7-Layer Ordered Flight Pipeline:** Complete lifecycle verification spanning *Authentication*, *Search Validation*, *Flight Info Math*, *Filter & Sort*, *Pricing & Commission Breakdown*, *Passenger Details & Ancillaries*, and *Ticketing & Void Operations*.
- **3-Tier Hotel Architecture:** Tiered execution splitting hotel tests into fast CI **Smoke** (~5 min), **Critical Path** (~15 min), and thorough **Regression** (46 test cases including heavy 1–5 room occupancy matrices).
- **Multi-Supplier Sandboxes:** Parameterized supplier execution across **Atlas SandBox**, **TravelRobot**, and **YueHang** in both Chromium and Firefox.
- **Centralized Data-Driven Coupon Suite:** 14 automated coupon validation scenarios covering flat discounts, percentage calculations on total published fare, case insensitivity, route restrictions, expiration dates, inactive states, and financial safety guardrails (`finalPrice >= 0`).
- **Resilient Page Object Model (POM):** Decoupled UI selectors and interaction workflows with smart auto-wait helpers and dynamic polling to eliminate flakiness.
- **Shareable Standalone Reports:** One-command Allure single-file HTML generation (`index.html`) that can be emailed or sent via Slack for instant zero-dependency stakeholder review.

---

## ⚡ Quick Start & Installation

### Prerequisites
- **Node.js:** `v18.x` or higher (Recommended: LTS)
- **NPM:** `v9.x` or higher
- **Java JRE/JDK:** Required if using global Allure CLI (optional when using bundled single-file generator)

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone <repository-url>
cd flight-booking-automation-reordered-v2

# Install project dependencies
npm install

# Install Playwright browser binaries and system dependencies
npx playwright install --with-deps
```

### 2. Configure Environment Variables
```bash
# Copy template configuration
cp .env.example .env
```

---

## ⚙️ Environment Configuration

Populate your `.env` file with appropriate target URLs and credentials:

```ini
# Base URLs
BASE_URL=https://b2b.innovatedemo.com
B2C_BASE_URL=https://b2c.innovatedemo.com

# Default B2B Agent Credentials
TEST_USERNAME=your_agent_username
TEST_PASSWORD=your_agent_password

# Multi-Worker Parallel Credentials (Optional)
TEST_USERNAME_1=your_agent_worker1
TEST_PASSWORD_1=your_password_worker1

TEST_USERNAME_2=your_agent_worker2
TEST_PASSWORD_2=your_password_worker2

# Execution Settings (Optional overrides)
BROWSER=chromium         # chromium | firefox
WORKERS=1                # Parallel worker count
CI=false                 # Set true in CI/CD pipeline
```

---

## 🚀 Test Execution Guide

### ✈️ Flight Module Commands

| Target / Intent | Headless (CI/CD) | Headed (Debug / Demo) |
| :--- | :--- | :--- |
| **Standard Flight Suite (Chrome)** | `npm test` | `npm run test:chrome:headed` |
| **Flight Booking & PNR Suite** | `npm run test:flight:booking` | `npm run test:flight:booking:headed` |
| **Flight Search & Validations** | `npm run test:search` | `npm run test:search:headed` |
| **Core Flight UI Portal Pipeline** | `npm run test:portal` | `npm run test:portal -- --headed` |
| **Firefox Browser Flight Suite** | `npm run test:firefox` | `npm run test:firefox:headed` |
| **Cross-Browser Suite (Chrome + Firefox)** | `npm run test:cross-browser` | `npm run test:cross-browser -- --headed` |
| **Full Flight Matrix (All Suppliers)** | `npm run test:full-matrix` | `npm run test:full-matrix -- --headed` |

---

### 🏢 Multi-Supplier Matrix Commands

Test flight workflows against isolated supplier GDS/aggregators:

| Supplier Sandbox | Chromium | Firefox | Both Browsers | Headed Mode |
| :--- | :--- | :--- | :--- | :--- |
| **Atlas SandBox** | `npm run test:atlas:chrome` | `npm run test:atlas:firefox` | `npm run test:atlas` | `npm run test:atlas -- --headed` |
| **TravelRobot** | `npm run test:travelrobot:chrome` | `npm run test:travelrobot:firefox` | `npm run test:travelrobot` | `npm run test:travelrobot -- --headed` |
| **YueHang** | `npm run test:yuehang:chrome` | `npm run test:yuehang:firefox` | `npm run test:yuehang` | `npm run test:yuehang -- --headed` |
| **All Suppliers Combined** | `npm run test:supplier` | - | - | `npm run test:supplier -- --headed` |
| **Dual Matrix (YueHang Chrome + Atlas Firefox)** | `npm run test:yuehang-atlas` | - | - | `npm run test:yuehang-atlas:headed` |

---

### 🎟️ Coupon Code Suite Commands (B2B + B2C)

Unified and isolated test runners for promotion and coupon validation:

```bash
# 🎯 1. Run Unified Suite across both B2B and B2C in Headed Mode
npm run test:coupon:headed

# 🚀 2. Run Unified Suite in Headless Mode (for CI/CD)
npm run test:coupon

# 🌐 3. Run B2C Flight Coupon Suite Only
npm run test:coupon:b2c:headed
npm run test:coupon:b2c

# 🏢 4. Run B2B Flight Coupon Suite Only
npm run test:coupon:b2b:headed
npm run test:coupon:b2b
```

---

### 🏨 Hotel Automation Suite Commands

Tiered hotel automation covering search, filters, room selection, occupancy combinations, and voucher downloads:

```bash
# 🔥 1. Hotel Fast Smoke Suite (~5 min, Fast CI Gatekeeper)
npm run test:hotel:smoke
npm run test:hotel:smoke:headed

# ⚡ 2. Hotel Critical Path Suite (~15 min)
npm run test:hotel:critical
npm run test:hotel:critical:headed

# 🚀 3. Hotel E2E Happy Path (Complete Booking Flow)
npm run test:hotel:e2e
npm run test:hotel:e2e:headed

# 👥 4. Hotel Multi-Occupancy Suite (1-5 Rooms, 1-9 Adults, 0-4 Children)
npm run test:hotel:booking
npm run test:hotel:booking:headed

# 🔄 5. Full Hotel Regression Suite (All 46 Tests)
npm run test:hotel:regression
npm run test:hotel:regression:headed

# 🏨 6. Run All Hotel Suites (All Tiers Combined)
npm run test:hotel
npm run test:hotel:headed
```

#### Individual Hotel Feature Specs
```bash
npm run test:hotel:search         # Search inputs, auto-suggest, date pickers
npm run test:hotel:filters        # Price sliders, star ratings, amenities
npm run test:hotel:details        # Room selection & detail tabs
npm run test:hotel:confirmation   # Booking confirmation & voucher generation
npm run test:hotel:history        # Booking history & status validation
npm run test:hotel:cancellation   # Cancellation policies & requests
npm run test:hotel:flaky          # Heavy multi-room supplier stress scenarios
```

---

### 🏷️ Tag-Based Targeted Execution

Run tests dynamically using Playwright's `--grep` tagging engine:

```bash
# Run all Smoke tests across the repository
npm run test:smoke

# Run all Regression tests
npm run test:regression

# Run all Functional verification tests
npm run test:functional

# Run all Coupon tests (B2B + B2C)
npx playwright test --grep @coupon

# Run all Supplier integration tests
npm run test:supplier

# Run specific Critical path tests
npx playwright test --grep @critical
```

---

## 📂 Project Directory Structure

```
flight-booking-automation-reordered-v2/
├── .auth/                               # Cached authentication storage state (session reuse)
├── data/                                # Dynamic & static test datasets
│   ├── testData.js                      # Passenger profiles, dates & hotel search data
│   ├── supplierTestData.js              # Route matrix for Atlas, TravelRobot, YueHang
│   └── couponTestData.js                # Centralized dataset (TC-CPN-01 to TC-CPN-12)
├── fixtures/                            # Custom Playwright fixtures
│   ├── authFixture.js                   # Authenticated agent session & supplier parameterization
│   └── hotelFixture.js                  # Pre-configured Hotel POM instances
├── helpers/                             # Business logic computation & assertions
│   ├── priceCalculator.js               # Commission, base fare, tax & discount math
│   └── searchHelper.js                  # Search helper routines & form handlers
├── utils/                               # Generic browser utilities
│   └── waitHelper.js                    # Resilient element polling & overlay dismissal
├── pages/                               # Page Object Models (Encapsulated UI Logic)
│   ├── LoginPage.js                     # B2B Login & Session Management
│   ├── FlightSearchPage.js              # One-Way, Round-Trip & Multi-City search form
│   ├── FlightResultsPage.js             # Flight cards, selection & filters
│   ├── FlightCommissionPage.js          # Fare breakdown & agent commission
│   ├── PassengerDetailsPage.js          # Pax form, ancillaries & B2B coupon input
│   ├── B2CFlightPage.js                 # B2C Search, flight select & B2C coupon input
│   ├── HotelSearchPage.js               # Destination autocomplete & date pickers
│   ├── HotelFilterPage.js               # Property filters, rating & price range
│   ├── HotelDetailsPage.js              # Hotel info & room select
│   ├── HotelGuestFormPage.js            # Guest checkout form & terms
│   ├── HotelBookingConfirmationPage.js  # PNR/Tracking ID & voucher PDF
│   └── HotelHistoryPage.js              # Booking records & cancellation
├── tests/                               # Automated Test Specifications
│   ├── flights/                         # B2B Flight 7-Layer Pipeline + Coupon
│   │   ├── 01-auth.spec.js              # Layer 1: Authentication & Security
│   │   ├── 02-search.spec.js            # Layer 2: Search Inputs & Validations
│   │   ├── 03-flightInfo.spec.js        # Layer 3: Flight Information & Duration Math
│   │   ├── 04-filters.spec.js           # Layer 4: Filters & Sorting Logic
│   │   ├── 05-pricing.spec.js           # Layer 5: Pricing, Commission & Currencies
│   │   ├── 06-booking.spec.js           # Layer 6: Booking Flows & Ancillaries
│   │   ├── 07-ticketing.spec.js         # Layer 7: Ticket Issuance & Cancellation
│   │   └── 08-flight-coupon.spec.js     # B2B Flight Coupon Validation Suite
│   ├── b2c/
│   │   └── flights/
│   │       └── 01-flight-coupon.spec.js # B2C Flight Coupon Validation Suite
│   └── hotels/                          # Tiered Hotel Test Architecture (46 Tests)
│       ├── smoke/                       # 🔥 Fast CI Smoke Suite
│       │   └── hotel-smoke.spec.js
│       ├── e2e/                         # 🚀 E2E Happy Path Suite
│       │   └── 00-hotel-e2e-happy-path.spec.js
│       └── regression/                  # 🔄 Full Production Regression Suite
│           ├── 01-hotel-search.spec.js
│           ├── 02-hotel-filters.spec.js
│           ├── 03-hotel-details.spec.js
│           ├── 04-hotel-booking.spec.js
│           ├── 05-hotel-confirmation.spec.js
│           ├── 06-hotel-history.spec.js
│           └── 07-hotel-cancellation.spec.js
├── reports/                             # Native HTML reports
├── allure-results/                      # Raw Allure test result artifacts
├── allure-report/                       # Generated standalone Allure single-file report
├── playwright.config.js                 # Global Playwright configuration & project pipelines
├── package.json                         # Scripts & dependency definitions
├── TEST_ROADMAP.md                      # Comprehensive Flight & Coupon Roadmap
└── HOTEL_AUTOMATION_ROADMAP.md          # 60 Hotel Test Cases Execution Roadmap
```

---

## 🧪 Test Suite Coverage & Matrix

### 1. B2B Flight 7-Layer Pipeline

| Layer | Suite Name | Description | Key Scenarios |
| :---: | :--- | :--- | :--- |
| **L1** | **Authentication** | Login & session integrity | Valid/Invalid login, SQLi/XSS prevention, session persistence, back-button security. |
| **L2** | **Flight Search** | Flight search workflows | One-Way, Round-Trip, Multi-City, Multi-Pax (Adult/Child/Infant), Date boundaries, Cabin Class. |
| **L3** | **Flight Information** | Schedule & math validation | Departure/Arrival time formats, duration math, transit layover calculations. |
| **L4** | **Filters & Sort** | Search result filtering | Airline filter, Stops (Direct/1-Stop), Baggage rules, Price ascending/descending, Duration sort. |
| **L5** | **Pricing & Wallet** | Financial breakdown | Base fare, Tax breakdown, Agent commission deduction, Currency conversion (BDT ⇄ USD). |
| **L6** | **Flight Booking** | Booking & Passenger forms | Adult, Child & Infant booking, Passport length validations, SSR (Meals/Wheelchair), Multi-Pax. |
| **L7** | **Ticketing** | Post-booking operations | Issue Ticket, PDF Voucher generation & download, Booking cancellation & toast assertions. |

---

### 2. Dynamic Coupon Validation Matrix (14 Scenarios)

Centralized data-driven test coverage defined in [`data/couponTestData.js`](./data/couponTestData.js):

| Test ID | Coupon Code | Rule / Validation Logic | Expected Result | B2B Portal | B2C Portal |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **`TC-CPN-01`** | `AUG27` | Flat / Fixed Discount (৳2,000 off) | ✅ Applied | ✅ | ✅ |
| **`TC-CPN-02`** | `aug27` | Case-Insensitive Lowercase Input | ✅ Applied | ✅ | ✅ |
| **`TC-CPN-03`** | `10PERCENT` | 10% Percentage Discount on Total Published Fare | ✅ Applied (Exact 10% computed) | ✅ | ✅ |
| **`TC-CPN-04A`**| `DOMESTIC500` | Domestic Route Discount (`DAC ➔ CXB`) | ✅ Applied | ✅ | ✅ |
| **`TC-CPN-04B`**| `DOMESTIC500` | Reject Domestic Coupon on International Route (`DAC ➔ DEL`) | ❌ Error Block | ✅ | ✅ |
| **`TC-CPN-05A`**| `INTL1500` | International Route Discount (`DAC ➔ DEL`) | ✅ Applied | ✅ | ✅ |
| **`TC-CPN-05B`**| `INTL1500` | Reject International Coupon on Domestic Route (`DAC ➔ CXB`) | ❌ Error Block | ✅ | ✅ |
| **`TC-CPN-06`** | `EXPIRED2026` | Expired Coupon Date Boundary | ❌ Error Block | ✅ | ✅ |
| **`TC-CPN-07`** | `INACTIVE100` | Admin Inactive / Disabled Status | ❌ Error Block | ✅ | ✅ |
| **`TC-CPN-08`** | `MINORDER9999` | Minimum Order Value Constraint (Min ৳50,000) | ❌ Error Block | ✅ | ✅ |
| **`TC-CPN-09`** | `HOTELONLY` | Service Restriction (Hotel coupon on flight checkout) | ❌ Error Block | ✅ | ✅ |
| **`TC-CPN-10`** | `INVALIDCOUPON999`| Non-existent / Fake Coupon Code | ❌ Error Block | ✅ | ✅ |
| **`TC-CPN-11`** | `AUG27` | Financial Safety: Non-negative price check (`finalPrice >= 0`) | ✅ Verified | ✅ | ✅ |
| **`TC-CPN-12`** | `LIMIT1` | Global Usage Limit Expiry Cycle | ❌ Usage Limit Error | ✅ | ✅ |

---

### 3. Hotel Automation Suite (46 Tests)

| Tier | Category | Test Coverage |
| :--- | :--- | :--- |
| **Smoke** | `HTL-SMOKE-01 -> 02` | Rapid health check on search and basic room availability. |
| **E2E** | `HTL-E2E-01` | Complete End-to-End flow: Search ➔ Details ➔ Multi-Guest Form ➔ Confirmation ➔ Voucher PDF. |
| **Regression** | `HTL-01 -> HTL-10` | Hotel Search, auto-suggest, date pickers, boundary validations. |
| **Regression** | `HTL-11 -> HTL-20` | Star ratings (3★, 4★, 5★), Price range sliders, amenities, distance sorting. |
| **Regression** | `HTL-21 -> HTL-29` | Hotel Details tabs, room inclusions, cancellation policies. |
| **Regression** | `HTL-30 -> HTL-36` | **Multi-Room Occupancy Matrix:** 1 to 5 Rooms, 1 to 9 Adults, 0 to 4 Children. |
| **Regression** | `HTL-37 -> HTL-44` | Booking Confirmation, Tracking ID generation, Voucher download. |
| **Regression** | `HTL-45 -> HTL-52` | Booking History, Status filters (Confirmed, Pending, Cancelled). |
| **Regression** | `HTL-53 -> HTL-60` | Cancellation requests, policy verifications, toast messages. |

---

## 📊 Allure Reporting & Developer Sharing Workflow

### 🔄 Clean Execution & Single-File Report Workflow

Follow this workflow to ensure clean test runs without stale artifact conflicts:

```bash
# Step 1: Clean previous test results & reports
npm run allure:clean

# Step 2: Run target test suite (e.g. Flight Coupon or Hotel Suite)
npm run test:coupon

# Step 3: Generate a single standalone HTML report
npm run report:single-file

# Step 4: (Optional) Preview report locally on a web server
npm run report:open
```

### 📩 Sharing Reports with Stakeholders & Developers
1. Locate the generated standalone file: **`allure-report/index.html`**
2. Send this **`index.html`** file directly via **Slack, Jira, or Email**.
3. **Developer Experience:** Developers can open `index.html` directly in **any web browser** with full interactivity, embedded failure screenshots, error traces, and execution timings — **no Node.js, web server, or Allure CLI required**.

---

## 🔄 CI/CD Pipeline Integration

Here is a production-grade **GitHub Actions** workflow example (`.github/workflows/e2e-tests.yml`):

```yaml
name: Travel Portal E2E Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
  schedule:
    - cron: '0 2 * * *' # Nightly regression run at 2 AM UTC

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 60

    steps:
      - name: Checkout Codebase
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium

      - name: Run Test Suite
        env:
          BASE_URL: ${{ secrets.BASE_URL }}
          B2C_BASE_URL: ${{ secrets.B2C_BASE_URL }}
          TEST_USERNAME: ${{ secrets.TEST_USERNAME }}
          TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
          CI: true
        run: npm test

      - name: Generate Standalone Allure Report
        if: always()
        run: npm run report:single-file

      - name: Upload Test Report Artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: allure-single-file-report
          path: allure-report/index.html
          retention-days: 14
```

---

## 🛡️ Engineering Best Practices & Standards

1. **Page Object Model (POM) Encapsulation:**
   - Test files contain zero direct DOM locators (`page.locator(...)`); all UI selectors and interactions are encapsulated within class methods inside `pages/`.
2. **Explicit Financial Math Assertions:**
   - Financial deductions (e.g., 10% coupon discounts, base fare + tax = total fare, agent commissions) are explicitly verified using [`priceCalculator.js`](./helpers/priceCalculator.js) within a ±1 Tk rounding tolerance.
3. **Resilient Wait Strategies:**
   - Avoid hardcoded static sleeps (`page.waitForTimeout`). Use `waitForLoadState('domcontentloaded')`, element state checks, or [`waitHelper.js`](./utils/waitHelper.js).
4. **Session Reusability (`storageState.json`):**
   - High-volume regression suites reuse authenticated storage states to avoid redundant logins across tests.
5. **Trace & Video Capture on Failure:**
   - Configured to capture full Playwright execution traces, screenshots, and video recordings on failure (`retain-on-failure`), minimizing debug turnaround times.

---

## 👨‍💻 Author & Maintainer

<p align="left">
  <b>Md. Sozibul Islam</b><br>
  <i>QA Automation Engineer & SDET</i>
</p>

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sozibul23)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/md-sozibul-islam/)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:sozibul23@gmail.com)

- 🐙 **GitHub:** [@sozibul23](https://github.com/sozibul23)
- 💼 **LinkedIn:** [linkedin.com/in/md-sozibul-islam](https://www.linkedin.com/in/md-sozibul-islam/)
- 📧 **Email:** [sozibul23@gmail.com](mailto:sozibul23@gmail.com)

---

<p align="center">
  <b>Innovate Travel Portal QA Automation</b> • Built for Reliability, Speed, and Scale 🚀
</p>

