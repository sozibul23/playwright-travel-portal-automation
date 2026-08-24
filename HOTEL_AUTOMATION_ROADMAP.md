# 🏨 Hotel Module — Detailed Test Automation Roadmap & Execution Tracker

This document tracks execution status, sprint planning, and test coverage for all 60 test cases (`HTL-01` → `HTL-62`, excluding HTL-52/53 which are non-B2B) for the B2B Hotel Automation Portal.

---

## 📊 Overview Status

- **Total Test Cases**: 60
- **Completed**: 17 (Sprint 0, Sprint 1 Search/Filters, & Sprint 3 Multi-Room Occupancy Booking Suite)
- **Pending**: 43

---

## 🗂️ Sprint Breakdown & Test Tracker

### 🔹 Sprint 0 — Foundation & Infrastructure
- ✅ `Setup`: Update [testData.js](file:///c:/Users/sadhi/Downloads/flight-booking-automation-reordered-v2/data/testData.js) with hotel search, guest profiles & dynamic fake guest generator (`generateRandomHotelGuest`)
- ✅ `Calculator`: Create [priceCalculator.js](file:///c:/Users/sadhi/Downloads/flight-booking-automation-reordered-v2/helpers/priceCalculator.js) for hotel commission & net fare verification
- ✅ `Fixture`: Create [hotelFixture.js](file:///c:/Users/sadhi/Downloads/flight-booking-automation-reordered-v2/fixtures/hotelFixture.js) extending auth session state
- ✅ `Happy Path E2E`: [00-hotel-e2e-happy-path.spec.js](file:///c:/Users/sadhi/Downloads/flight-booking-automation-reordered-v2/tests/hotels/00-hotel-e2e-happy-path.spec.js) — **PASSED (46.3s)**

---

### 🔹 Sprint 1 — Hotel Search & Filters Suite (`tests/hotels/01-hotel-search.spec.js` & `02-hotel-filters.spec.js`)
* **POM Classes**: [HotelSearchPage.js](file:///c:/Users/sadhi/Downloads/flight-booking-automation-reordered-v2/pages/HotelSearchPage.js), [HotelFilterPage.js](file:///c:/Users/sadhi/Downloads/flight-booking-automation-reordered-v2/pages/HotelFilterPage.js)

#### 1. Search Inputs & Validations (`01-hotel-search.spec.js`)
- ✅ `HTL-01`: Search with valid destination, dates, 1 room/2 guests `@smoke @supplier` — **PASSED**
- ✅ `HTL-02`: Destination autocomplete (3+ characters suggestion popup) `@functional` — **PASSED**
- ✅ `HTL-03`: Multi-room, multi-guest search count persistence `@functional` — **PASSED**
- ⏳ `HTL-04`: Child age pricing category `@functional`
- ✅ `HTL-05`: Check-out before check-in validation error `@negative` — **PASSED**
- ⏳ `HTL-06`: Past date selection block `@negative`
- ⏳ `HTL-07`: Empty destination required-field error `@negative`
- ⏳ `HTL-08`: Max date range (>30 nights boundary check) `@functional`
- ⏳ `HTL-09`: Invalid characters in destination sanitization `@negative`
- ⏳ `HTL-10`: Search results pagination & continuous load `@functional`

#### 2. Filters & Sorting (`02-hotel-filters.spec.js`)
- ⏳ `HTL-11`: Price range slider filter `@functional`
- ✅ `HTL-12`: Star rating minimum (1 star minimum selectable) `@functional` — **PASSED**
- ⏳ `HTL-13`: Review score / User rating filter `@functional`
- ⏳ `HTL-14`: Amenity filter accuracy (WiFi, Pool check) `@functional`
- ⏳ `HTL-15`: Property type filter (Hotel / Resort / Apartment) `@functional`
- ⏳ `HTL-16`: Combined active filters intersection `@functional`
- ✅ `HTL-17`: Clear all filters reset button `@functional` — **PASSED**
- ✅ `HTL-18`: Sort by price (Low to High / High to Low) `@functional` — **PASSED**
- ⏳ `HTL-19`: Sort by rating / popularity `@functional`

---

### 🔹 Sprint 2 — Hotel Details & Room Selection (`tests/hotels/03-hotel-details.spec.js`)
* **POM Class**: [HotelDetailsPage.js](file:///c:/Users/sadhi/Downloads/flight-booking-automation-reordered-v2/pages/HotelDetailsPage.js)

- ⏳ `HTL-20`: Hotel details page load match `@smoke`
- ⏳ `HTL-21`: Room list pricing match `@functional`
- ⏳ `HTL-22`: Room occupancy match (Adults/Children) `@functional`
- ⏳ `HTL-23`: Meal plan labeling (Room only vs Breakfast) `@functional`
- ⏳ `HTL-24`: Refundable vs Non-refundable rate tag `@functional`
- ⏳ `HTL-25`: Sold-out room state disabled check `@negative`
- ⏳ `HTL-26`: Multiple room selection for group booking `@functional`
- ⏳ `HTL-27`: Price breakdown sum accuracy (Base + Tax = Total) `@functional`
- ⏳ `HTL-28`: Cancellation policy text match `@functional`
- ⏳ `HTL-29`: View on map popup modal `@functional`

---

### 🔹 Sprint 3 — Guest Form & Room Occupancy Booking Suite (`tests/hotels/04-hotel-guest-form.spec.js`)
* **POM Class**: [HotelGuestFormPage.js](file:///c:/Users/sadhi/Downloads/flight-booking-automation-reordered-v2/pages/HotelGuestFormPage.js)

- ✅ `HTL-30`: Booking — 1 Room for 1 Adult (Single Occupancy) — **PASSED (46.3s)**
- ✅ `HTL-31`: Booking — 1 Room for 2 Adults (Double Occupancy) — **PASSED (43.4s)**
- ✅ `HTL-32`: Booking — 1 Room for 2 Adults, 2 Children — **PASSED (45.3s)**
- ✅ `HTL-33`: Booking — 2 Rooms for 4 Adults, 2 Children — **PASSED (45.5s)**
- ✅ `HTL-34`: Booking — 3 Rooms for 7 Adults, 3 Children — **PASSED (47.9s)**
- ✅ `HTL-35`: Booking — 4 Rooms for 9 Adults, 4 Children — **PASSED (49.4s)**
- ✅ `HTL-36`: Booking — 5 Rooms for 7 Adults, 4 Children — **PASSED (48.9s)**
- ⏳ `HTL-37`: Booking session timeout alert `@negative`
- ⏳ `HTL-38`: Commission calculation verification against agent tier `@financial`
- ⏳ `HTL-39`: Net payable price match check `@financial`

---

### 🔹 Sprint 4 — Confirmation & Voucher (`tests/hotels/05-hotel-confirmation.spec.js`)
* **POM Class**: [HotelBookingConfirmationPage.js](file:///c:/Users/sadhi/Downloads/flight-booking-automation-reordered-v2/pages/HotelBookingConfirmationPage.js)

- ⏳ `HTL-40`: Instant booking confirmation tracking ID generation `@smoke`
- ⏳ `HTL-41`: On-request booking status pending warning `@functional`
- ⏳ `HTL-42`: Booking details summary match (Dates, Room, Guests, Price) `@functional`
- ⏳ `HTL-43`: PDF Voucher generation & download `@functional`
- ⏳ `HTL-44`: Voucher fare options (with fare vs without fare toggle) `@functional`
- ⏳ `HTL-45`: Agent logo on voucher check `@functional`
- ⏳ `HTL-46`: Cancellation policy display on confirmation page `@functional`
- ⏳ `HTL-47`: Email voucher trigger notification `@functional`

---

### 🔹 Sprint 5 — Booking History & Actions (`tests/hotels/06-hotel-history.spec.js`)
* **POM Class**: [HotelHistoryPage.js](file:///c:/Users/sadhi/Downloads/flight-booking-automation-reordered-v2/pages/HotelHistoryPage.js)

- ⏳ `HTL-48`: Hotel booking history list entry `@smoke`
- ⏳ `HTL-49`: Filter hotel history by date range `@functional`
- ⏳ `HTL-50`: Filter hotel history by status (Confirmed, Cancelled, Pending) `@functional`
- ⏳ `HTL-51`: Search hotel history by Booking ID / Guest Name `@functional`
- ⏳ `HTL-54`: Download voucher from history table `@functional`
- ⏳ `HTL-55`: View booking details from history table `@functional`

---

### 🔹 Sprint 6 — Cancellation & Modifications (`tests/hotels/07-hotel-cancellation.spec.js`)
* **POM Class**: [HotelHistoryPage.js](file:///c:/Users/sadhi/Downloads/flight-booking-automation-reordered-v2/pages/HotelHistoryPage.js)

- ⏳ `HTL-56`: Free cancellation before deadline `@functional`
- ⏳ `HTL-57`: Non-refundable cancellation warning & fee check `@negative`
- ⏳ `HTL-58`: Partial refund calculation verification `@financial`
- ⏳ `HTL-59`: Partial cancellation for multi-room booking `@functional`
- ⏳ `HTL-60`: Post-cancellation status update to Cancelled `@functional`
- ⏳ `HTL-61`: Refund ledger entry check `@financial`
- ⏳ `HTL-62`: Modification request (dates / guest name change) `@functional`

---

## 🏃 Running Hotel Test Commands

```bash
# Run all Hotel Specs
npm run test:hotel

# Run only E2E Happy Path
npm run test:hotel:e2e

# Run Room Occupancy Booking Suite (7 Occupancy Scenarios)
npx playwright test tests/hotels/04-hotel-guest-form.spec.js --project=hotel

# Run Hotel specs in headed mode
npm run test:hotel:headed
```
