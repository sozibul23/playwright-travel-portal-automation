# 🚀 Automation Test Roadmap & Execution Tracker

This document tracks test coverage and implementation status for **Flight (B2B + B2C)**, **Hotel**, and **Coupon Automation** suites.

---

## 📊 Overview Status

- **Total Test Cases**: 113 Tests
- **Completed & Passing**: 86 Tests (Flights: 32 | Hotels: 46 | Coupons: 8 B2B + 8 B2C)
- **Pending / Planned**: 19 Tests

---

## 🗂️ Task Breakdown by Test Layer

### 1️⃣ Authentication Suite (`tests/flights/01-auth.spec.js`)
- ✅ `SI-01`: Valid login -> dashboard redirect `@smoke @regression`
- ✅ `SI-02`: Session persistence after page refresh `@functional @regression`
- ✅ `SI-03`: Empty fields validation `@negative`
- ✅ `SI-04`: Valid username + wrong password `@negative`
- ✅ `SI-05`: Wrong username + valid password `@negative`
- ✅ `SI-06`: Both username and password wrong `@negative`
- ✅ `SI-07`: Unregistered username `@negative`
- ✅ `SI-08`: SQL Injection bypass attempt `@negative`
- ✅ `SI-09`: XSS script injection attempt `@negative`
- ✅ `SI-10`: Back button protection after logout `@functional @regression`

---

### 2️⃣ Flight Search Suite (`tests/flights/02-search.spec.js`)
- ✅ `TC-001`: One-Way Search `@smoke @supplier`
- ✅ `TC-001B`: Multi-Pax Search `@functional @supplier`
- ✅ `TC-002`: Round Trip Search `@regression @supplier`
- ✅ `TC-003`: Multi-City Search `@regression @supplier`
- ✅ `UI Check`: Switch between One Way and Round Trip tabs `@smoke @functional`
- ✅ `SN-01`: Origin and Destination empty validation `@negative`
- ✅ `SN-03`: Past departure date disabled `@negative @boundary`
- ✅ `SN-04`: Same Origin & Destination validation (e.g. DAC to DAC) `@negative`
- ✅ `SN-05`: Infant count > Adult count validation `@negative`
- ✅ `SN-06`: Maximum 9 total passengers limit check `@negative`
- ✅ `SN-07`: Return Date prior to Departure Date validation `@negative`
- ✅ `TC-003B`: Search Flight by Cabin Class (Business/Premium) `@functional`

---

### 3️⃣ Flight Info Suite (`tests/flights/03-flightInfo.spec.js`)
- ✅ `TC-009A`: Departure & Arrival Time Format check `@supplier @functional`
- ✅ `TC-009B`: Duration & Layover Time math verification `@supplier @functional`

---

### 4️⃣ Flight Filters & Sort Suite (`tests/flights/04-filters.spec.js`)
- ✅ `TC-004`: Airline Filter check `@supplier @functional`
- ✅ `TC-005`: Stops Filter check `@supplier @functional`
- ✅ `TC-008`: Baggage Filter check `@supplier @functional`
- ✅ `TC-006`: Price Sort check `@supplier @functional`
- ✅ `TC-007`: Seat Availability check `@supplier @functional`
- ✅ `TC-008B`: Departure/Arrival Time Slot filter `@functional`
- ✅ `TC-008C`: Flight Duration slider filter `@functional`
- ✅ `TC-008D`: Reset / Clear All Applied Filters `@functional`
- ✅ `TC-006B`: Sort by Shortest Duration / Earliest Departure `@functional`

---

### 5️⃣ Flight Pricing & Wallet Suite (`tests/flights/05-pricing.spec.js`)
- ✅ `TC-010B`: Commission & Discount Calculation `@supplier @regression`
- ✅ `TC-010`: Base Fare, Tax & Subtotal Breakdown `@supplier @regression`
- ✅ `TC-013`: Fare Change Validation `@supplier @regression`
- ✅ `TC-014`: Currency Switcher (BDT to USD) `@supplier @functional`
- ✅ `Pricing Check`: Baggage info check `@supplier @functional`
- ⏳ `TC-014B`: Insufficient Agent Balance modal check `@negative`
- ⏳ `TC-014D`: Fare Expiry & Session Timeout modal `@functional`

---

### 6️⃣ Flight Booking Suite (`tests/flights/06-booking.spec.js`)
- ✅ `TC-015`: Adult Booking & PNR `@smoke @supplier`
- ✅ `TC-016`: Child Booking `@supplier @regression`
- ✅ `TC-017`: Infant Booking `@supplier @regression`
- ✅ `TC-017B`: Multi-Pax Booking (4 Travelers) `@supplier @regression`
- ✅ `TC-018`: Passport Length Validation `@functional @regression`
- ✅ `TC-024`: Extra Ancillaries check `@supplier @functional`
- ✅ `TC-018B`: Passport Expiry under 6 months warning `@negative`
- ✅ `TC-018C`: Duplicate Passenger Name validation `@negative`
- ✅ `TC-024B`: Special Service Requests (SSR - Wheelchair / Meal) `@functional`
- ✅ `TC-018D`: Auto-Gender selection matching Title `@functional`

---

### 7️⃣ Ticketing & Cancellation Suite (`tests/flights/07-ticketing.spec.js`)
- ✅ `TC-023`: Issue Ticket & PDF Voucher download `@smoke @supplier`
- ✅ `TC-026`: Cancel Booking & Toast verification `@supplier @smoke @regression`
- ⏳ `TC-026B`: Hold PNR Expiry Timer verification `@functional`
- ⏳ `TC-027`: Void Issued Ticket within Same-Day Window `@regression`
- ⏳ `TC-028`: Flight Date Change / Re-issuance Request `@regression`

---

### 8️⃣ Flight Coupon Validation Suite (`tests/flights/08-flight-coupon.spec.js` & `tests/b2c/flights/01-flight-coupon.spec.js`)

#### 🟢 Phase 1: Core Dynamic Coupon Tests (9 Tests Implemented)
- ✅ `TC-CPN-01`: **Active Fixed Flat Discount** (`AUG27` - Fixed Amount deduction) `@coupon @b2b @b2c`
- ✅ `TC-CPN-02`: **Case-Insensitive Input** (`aug27` - Lowercase input handling) `@coupon @b2b @b2c`
- ✅ `TC-CPN-03`: **Percentage Discount with Max Cap** (`AUG26` - 10% with max discount cap) `@coupon @b2b @b2c`
- ✅ `TC-CPN-04`: **Expired Coupon Date Boundary** (`EXPIRED2024` - Block expired dates) `@coupon @b2b @b2c`
- ✅ `TC-CPN-05`: **Inactive Status Coupon** (`INACTIVE100` - Admin inactive state validation) `@coupon @b2b @b2c`
- ✅ `TC-CPN-06`: **Minimum Order Value Constraint** (`MINORDER999` - Order total below threshold) `@coupon @b2b @b2c`
- ✅ `TC-CPN-07`: **Invalid / Fake Coupon Code** (`INVALIDCOUPON999` - Non-existent coupon validation) `@coupon @b2b @b2c`
- ✅ `TC-CPN-08`: **Service Restriction Mismatch** (`HOTELONLY` - Hotel coupon rejected on flight checkout) `@coupon @b2b @b2c`
- ✅ `TC-CPN-09`: **Non-Negative Total Price Check** (Final payable price must be `>= 0`, never negative) `@coupon @b2b @b2c`

#### ⏳ Phase 2: Planned Advanced Admin Coupon Rules (13 Tests Planned)
- ⏳ `TC-CPN-10`: Future Date Coupon (Start Date in future)
- ⏳ `TC-CPN-11`: Specific Origin Airport restriction (`DAC` only)
- ⏳ `TC-CPN-12`: Specific Destination Airport restriction (`DXB` / `DEL` only)
- ⏳ `TC-CPN-13`: Connecting / Transit Airport matching rule
- ⏳ `TC-CPN-14`: Plating Carrier & Operating Airlines restriction
- ⏳ `TC-CPN-15`: Excluded RBD Class (e.g. Promo Economy exclusion)
- ⏳ `TC-CPN-16`: Usage Limit Exceeded (Coupon total use limit reach)
- ⏳ `TC-CPN-17`: Multi-Currency Conversion matching (USD to BDT)
- ⏳ `TC-CPN-18`: Payment Gateway Specific Discount (bKash/Nagad/Card)
- ⏳ `TC-CPN-19`: Device Specific Restriction (Web browser vs Mobile App)
- ⏳ `TC-CPN-20`: Coupon Remove / Reset (Restores original order price)
- ⏳ `TC-CPN-21`: Multiple Coupon Stacking prevention
- ⏳ `TC-CPN-22`: Blank / Whitespace Input validation

---

### 9️⃣ Hotel Module Suite (`tests/hotels/`) — 46 Tests

- ✅ `HTL-SMOKE-01 -> 02`: Hotel Smoke Suite (`tests/hotels/smoke/hotel-smoke.spec.js`)
- ✅ `HTL-E2E`: Full Hotel Booking Happy Path (`tests/hotels/e2e/00-hotel-e2e-happy-path.spec.js`)
- ✅ `HTL-01 -> 10`: Hotel Search Suite (`tests/hotels/regression/01-hotel-search.spec.js`)
- ✅ `HTL-11 -> 20`: Hotel Filters & Sorting (`tests/hotels/regression/02-hotel-filters.spec.js`)
- ✅ `HTL-21 -> 29`: Hotel Details & Room Select (`tests/hotels/regression/03-hotel-details.spec.js`)
- ✅ `HTL-30 -> 36`: Occupancy & Multi-Room Booking (`tests/hotels/regression/04-hotel-booking.spec.js`)
- ✅ `HTL-37 -> 44`: Booking Confirmation & Voucher (`tests/hotels/regression/05-hotel-confirmation.spec.js`)
- ✅ `HTL-45 -> 52`: Booking History & Status (`tests/hotels/regression/06-hotel-history.spec.js`)
- ✅ `HTL-53 -> 60`: Cancellation & Policy (`tests/hotels/regression/07-hotel-cancellation.spec.js`)

---

## 📌 Execution Commands Quick Reference

| Module / Target | Terminal Command |
| :--- | :--- |
| **All B2B Flight Tests** | `npm test` |
| **Unified Flight Coupon (B2B + B2C)** | `npm run test:coupon:headed` |
| **B2C Flight Coupon Only** | `npm run test:coupon:b2c:headed` |
| **B2B Flight Coupon Only** | `npm run test:coupon:b2b:headed` |
| **Hotel Smoke Suite (CI)** | `npm run test:hotel:smoke` |
| **Hotel Regression Suite** | `npm run test:hotel:regression` |
| **Full Hotel Suite** | `npm run test:hotel` |
| **Generate Single Shareable Report** | `npm run report:single-file` |
