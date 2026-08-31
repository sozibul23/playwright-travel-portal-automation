# ✈️ Travel Portal E2E QA Automation Framework

[![Playwright](https://img.shields.io/badge/Playwright-v1.40+-2EAD33?style=flat-square&logo=playwright&logoColor=white)](https://playwright.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ESM-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/)
[![Allure Report](https://img.shields.io/badge/Report-Allure%20Single--File-FF7800?style=flat-square&logo=allure&logoColor=white)](https://allurereport.org/)
[![Coverage](https://img.shields.io/badge/Coverage-120+%20Scenarios-purple?style=flat-square)](./TEST_ROADMAP.md)

Production-grade End-to-End (E2E) Test Automation Framework for **B2B Agent** and **B2C Consumer** travel portals. Built with **Playwright**, **Page Object Model (POM)**, **Dynamic Fixtures**, and **Allure Single-File Reporting**.

---

## 📌 Key Highlights

- **Dual-Portal Coverage:** Automates B2B Agent Portal and B2C Consumer Portal.
- **7-Layer Flight Pipeline:** Auth ➔ Search ➔ Flight Info Math ➔ Filters & Sorting ➔ Pricing & Commission ➔ Booking/Pax Form ➔ Ticketing & Void.
- **Dynamic Coupon Engine:** Comprehensive data-driven validation (Fixed/Percentage, Case Insensitivity, Route Rules, Expiry, Order Minima, Usage Limits, and Zero-Floor guardrails).
- **3-Tier Hotel Architecture:** Fast Smoke (~5 min), Critical Path (~15 min), and Full Regression (46 tests with 1–5 room multi-occupancy matrix).
- **Multi-Supplier Matrix:** Cross-browser validation across **Atlas**, **TravelRobot**, and **YueHang** sandboxes.
- **Zero-Dependency Reporting:** Standalone single-file Allure report (`index.html`) shareable via Slack/Email.

---

## ⚡ Quick Start

### Prerequisites
- **Node.js** `v18+` (LTS recommended)
- **NPM** `v9+`

### Installation
```bash
# 1. Clone the repository & install dependencies
git clone https://github.com/sozibul23/playwright-travel-portal-automation.git
cd playwright-travel-portal-automation
npm install

# 2. Install Playwright browser binaries
npx playwright install --with-deps

# 3. Configure environment variables
cp .env.example .env
```

---

## ⚙️ Environment Configuration

Set your credentials and endpoints in `.env`:

```ini
BASE_URL=https://b2b.innovatedemo.com
B2C_BASE_URL=https://b2c.innovatedemo.com

TEST_USERNAME=your_agent_username
TEST_PASSWORD=your_agent_password

BROWSER=chromium         # chromium | firefox
WORKERS=1                # Parallel worker count
CI=false                 # Set true in CI/CD pipeline
```

---

## 🚀 Test Execution

### ✈️ Flights & Multi-Supplier Suite
```bash
npm test                        # Default Flight Suite (Chromium headless)
npm run test:chrome:headed      # Headed execution for visual debug
npm run test:portal             # 7-Layer Core Flight Pipeline
npm run test:cross-browser      # Chromium + Firefox cross-browser run
npm run test:supplier           # All suppliers (Atlas, TravelRobot, YueHang)
npm run test:atlas              # Atlas Sandbox suite
npm run test:travelrobot        # TravelRobot suite
npm run test:yuehang            # YueHang suite
```

### 💰 Commission, Fees & FMG Markup Suite
```bash
npm run test:commission         # Run Commission & Discount Suite (Headless)
npm run test:commission:headed  # Run Commission & Discount Suite (Headed)
npm run test:fees               # Run Multi-Pax Fees & Markup Suite (Headless)
npm run test:fees:headed        # Run Multi-Pax Fees & Markup Suite (Headed)
```

### 🎟️ Coupon & Promotion Suite
```bash
npm run test:coupon             # Run Unified Suite (B2B + B2C headless)
npm run test:coupon:headed      # Run Unified Suite (Headed)
npm run test:coupon:b2b         # B2B Flight Coupon tests only
npm run test:coupon:b2c         # B2C Flight Coupon tests only
npm run test:coupon:limit:cycle # Global limit exhaustion cycle
npm run test:coupon:booking:e2e # Coupon apply to PNR booking E2E
```

### 🏨 Hotel Suite
```bash
npm run test:hotel:smoke        # Fast Smoke (~5 min, CI gatekeeper)
npm run test:hotel:critical     # Critical Path (~15 min)
npm run test:hotel:e2e          # E2E Complete Booking Flow
npm run test:hotel:booking      # Multi-Occupancy Suite (1-5 Rooms, Pax combinations)
npm run test:hotel:regression   # Full 46-Test Hotel Regression
```

### 🏷️ Tag-Based Targeted Execution
```bash
npm run test:smoke              # All @smoke tests
npm run test:regression         # All @regression tests
npm run test:functional         # All @functional tests
npx playwright test --grep @coupon
```

---

## 📂 Project Structure

```
├── data/               # Dynamic & static datasets (passengers, suppliers, coupons)
├── fixtures/           # Custom Playwright fixtures (auth session & hotel page instances)
├── helpers/            # Financial math calculation & search helpers
├── pages/              # Page Object Models (encapsulated UI actions & locators)
│   ├── LoginPage.js
│   ├── FlightSearchPage.js / FlightResultsPage.js / FlightCommissionPage.js
│   ├── PassengerDetailsPage.js / B2CFlightPage.js
│   └── HotelSearchPage.js / HotelDetailsPage.js / HotelGuestFormPage.js ...
├── tests/
│   ├── flights/        # 7-Layer Pipeline, Coupons, Limit Exhaustion & E2E
│   ├── b2c/flights/    # B2C Portal Coupon & Flight tests
│   └── hotels/         # Tiered Suites: smoke/, e2e/, regression/
├── utils/              # Resilient element polling & wait utilities
├── playwright.config.js# Test runner configuration & multi-project setup
└── package.json
```

---

## 📊 Allure Reporting Workflow

Generate a zero-dependency standalone HTML report that can be opened anywhere without a server or Node.js:

```bash
# 1. Clean previous artifacts & run tests
npm run allure:clean
npm test

# 2. Generate standalone single-file report
npm run report:single-file

# 3. (Optional) Open report locally
npm run report:open
```

> 💡 **Report Artifact:** The generated `allure-report/index.html` contains embedded screenshots, execution traces, and logs. It can be shared directly via Email, Jira, or Slack.

---

## 🔄 CI/CD Pipeline (GitHub Actions)

Production-ready pipeline configuration (`.github/workflows/e2e-tests.yml`):

```yaml
name: Travel Portal E2E Tests
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * *' # Nightly run at 2 AM UTC

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm test
        env:
          BASE_URL: ${{ secrets.BASE_URL }}
          TEST_USERNAME: ${{ secrets.TEST_USERNAME }}
          TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
          CI: true
      - name: Generate Allure Report
        if: always()
        run: npm run report:single-file
      - name: Upload Artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-report
          path: allure-report/index.html
          retention-days: 14
```

---

## 🛡️ Best Practices & Quality Standards

1. **Page Object Model (POM):** Locators and interactions strictly encapsulated within `pages/`; zero raw DOM selectors inside test specs.
2. **Financial Precision:** Currency computations and percentage discounts verified within ±1 Tk mathematical tolerance.
3. **Deterministic Waits:** Zero hardcoded static timeouts (`page.waitForTimeout`); driven by state assertions and dynamic polling.
4. **Session Reuse:** Authenticated state cached via `storageState.json` to eliminate repetitive login overhead.
5. **Artifact Capture:** Automated capture of screenshots, videos, and Playwright traces on test failures.

---

## 👨‍💻 Author

**Md. Sozibul Islam** — *QA Automation Engineer & SDET*  
[![GitHub](https://img.shields.io/badge/GitHub-sozibul23-181717?style=flat-square&logo=github)](https://github.com/sozibul23)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-md--sozibul--islam-0077B5?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/md-sozibul-islam/)
[![Email](https://img.shields.io/badge/Email-sozibul23%40gmail.com-D14836?style=flat-square&logo=gmail)](mailto:sozibul23@gmail.com)

