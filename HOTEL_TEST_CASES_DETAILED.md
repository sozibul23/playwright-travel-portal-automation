# Hotel Module — Detailed Test Cases

Full step-by-step version of all 60 test cases (HTL-52/53 excluded — not applicable on b2b). Companion to `HOTEL_TEST_STRATEGY.md` and `HOTEL_AUTOMATION_ROADMAP.md`.

---

## A. Hotel Search (HTL-01 → HTL-10)

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| HTL-01 | Search with valid destination, dates, 1 room/2 guests | Go to Hotel tab → enter valid destination → select check-in/check-out → set 1 room, 2 guests → click Search | Hotel list is displayed, matching the search criteria | High |
| HTL-02 | Destination autocomplete | Type 3+ characters of a city name in destination field | Suggestion dropdown appears from the 3rd character onward; selecting a suggestion fills the field correctly | High |
| HTL-03 | Multi-room, multi-guest search | Set 2 rooms, mixed adults/children across rooms → Search → proceed to booking | Guest count from search carries through unchanged into results and the booking flow | High |
| HTL-04 | Child age pricing | Add a child guest, select an age → Search | Pricing reflects the correct child-rate category for that age | Medium |
| HTL-05 | Check-out before check-in | Select check-out date earlier than check-in date → attempt Search | Validation error shown; search is blocked | High |
| HTL-06 | Past date selection | Attempt to select a check-in date before today | Validation error shown / past dates disabled | Medium |
| HTL-07 | Empty destination | Leave destination field empty → click Search | Required-field error shown; search blocked | High |
| HTL-08 | Max date range | Select check-in/check-out spanning more than 30 nights | System either allows within a defined cap or shows a boundary error — verify against actual policy | Low |
| HTL-09 | Invalid characters in destination | Enter special characters (e.g. `@#$%`) in destination field | No crash; either no matches found or input sanitized, no broken UI state | Low |
| HTL-10 | Search results pagination | Perform a search returning many results → scroll to bottom / go to next page | Additional results load correctly, no duplicates or missing entries | Medium |

## B. Filters & Sorting (HTL-11 → HTL-19)

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| HTL-11 | Price range filter | Search hotels → set min/max price filter | Only hotels within range are shown; currency symbol is displayed on the filter | High |
| HTL-12 | Star rating minimum | Open star rating filter | Lowest selectable value is 1 star, not 0 | Medium |
| HTL-13 | Review score filter | Apply a minimum user-rating filter | Only hotels meeting/exceeding the rating are shown | Medium |
| HTL-14 | Amenity filter accuracy | Select a specific amenity (e.g. "Pool") → apply | Every returned hotel actually has that amenity — no mismatched results | Critical |
| HTL-15 | Property type filter | Filter by property type (hotel/resort/apartment) | Results match selected type; no null/empty property type values shown | Medium |
| HTL-16 | Combined filters | Apply price + star rating + amenity together | Result set correctly reflects the intersection of all active filters | High |
| HTL-17 | Clear all filters | Apply several filters → click "Clear all" | All filters reset; full result set returns | Medium |
| HTL-18 | Sort by price | Select "Price: Low to High", then "High to Low" | List order updates correctly both directions | High |
| HTL-19 | Sort by rating | Select "Rating" / "Popularity" sort | List order updates to reflect the selected sort | Medium |

## C. Hotel Details & Room Selection (HTL-20 → HTL-29)

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| HTL-20 | Hotel details load | Click a hotel from results | Details page shows correct name, address, images, amenities matching the listing | High |
| HTL-21 | Room list pricing | Open a hotel's room list | Room types and prices match what was implied by the search/listing | High |
| HTL-22 | Room occupancy match | Select a room | Occupancy shown (adults/children) matches what was set at search | High |
| HTL-23 | Meal plan labeling | Compare "room only" vs "breakfast included" vs "half board" options | Each is clearly labeled; price updates correctly per selection | High |
| HTL-24 | Refundable vs non-refundable | View rate options on a room | Refundable/non-refundable status is clearly and correctly labeled | High |
| HTL-25 | Sold-out room state | Locate a room marked unavailable | Room shows disabled state, cannot be selected/added to booking | Medium |
| HTL-26 | Multiple room selection | Select 2+ rooms for a group booking | All selected rooms carry into the next step correctly | Medium |
| HTL-27 | Price breakdown accuracy | Open price breakdown (base rate, tax, fees) on a room | Sum of line items equals the displayed total | High |
| HTL-28 | Cancellation policy text | View cancellation policy on a selected rate | Policy text matches the actual refundable/non-refundable rate type | Medium |
| HTL-29 | View on map | Click "View on map" on hotel details | Map opens and shows the correct hotel location | High |

## D. Guest Details Form (HTL-30 → HTL-38)

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| HTL-30 | Valid guest submission | Fill lead guest name, email, phone with valid data → submit | Form accepts and proceeds to next step | High |
| HTL-31 | Required field validation | Leave name/email/phone empty → submit | Visible error per empty field; submission blocked | High |
| HTL-32 | Invalid email format | Enter a malformed email (e.g. `abc@`) → submit | Validation error shown | Medium |
| HTL-33 | Invalid phone format | Enter an incomplete/invalid phone number → submit | Validation error shown | Medium |
| HTL-34 | Name field numeric-only | Enter digits only in the name field → submit | Validation error shown; numeric-only name rejected | Medium |
| HTL-35 | Negative age | Enter a negative number in the age field → submit | Validation error shown; negative age rejected | High |
| HTL-36 | Guest-per-room cap | Attempt to add guests beyond the confirmed per-room limit | System blocks addition beyond the limit with a clear message | High |
| HTL-37 | Room-per-booking cap | Attempt to add rooms beyond the confirmed per-booking limit | System blocks addition beyond the limit with a clear message | High |
| HTL-38 | Multi-room guest details | Book 2+ rooms → fill guest details separately per room | Each room retains its own distinct guest data, no cross-contamination | High |

## E. Booking Confirmation & Payment (HTL-39 → HTL-46)

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| HTL-39 | Price consistency | Note price at room selection → proceed to confirmation | Final price on confirmation matches the price shown at room selection | Critical |
| HTL-40 | Commission calculation | Complete a booking → check commission applied | Commission = (BaseFare × baseFarePercent%) + (Tax × taxPercent%), matching shared formula | Critical |
| HTL-41 | Booking reference generated | Complete a booking | A valid, unique reference/PNR number is generated | Critical |
| HTL-42 | Confirmation email/voucher | Complete a booking → check confirmation email/voucher | Hotel name, dates, and guest details match the booking | High |
| HTL-43 | Payment gateway redirect | Proceed to payment with valid details | Redirects correctly, payment completes, booking confirms | High |
| HTL-44 | Declined payment | Submit payment with details that trigger decline | Booking is not confirmed; clear error shown | High |
| HTL-45 | Session timeout at checkout | Let session expire mid-checkout | Graceful error/redirect, no partial/corrupt booking created | Medium |
| HTL-46 | Room sold out mid-flow | Select a room, then simulate it becoming unavailable before confirming | Clear error shown at confirmation, booking is not created | Medium |

## F. Post-Booking (HTL-47 → HTL-51, HTL-62)

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| HTL-47 | Booking history status | Complete a booking → open "My Bookings" | Booking listed with correct status (Hold/Confirmed), hotel, and dates | High |
| HTL-48 | Cancel while Hold | Create a booking, leave in Hold → open it → click Cancel | Cancel button visible/enabled; cancellation succeeds; status updates to Cancelled | High |
| HTL-49 | Cancel non-refundable (Hold) | Create a non-refundable booking, still in Hold → attempt Cancel | Blocked or warned per rate policy | Medium |
| HTL-50 | Booking modification | While in Hold, open modify option → change date/room | Modification applies, price recalculates correctly | Low |
| HTL-51 | Duplicate booking prevention | Attempt identical booking (same guest, hotel, dates) twice | System blocks or warns before allowing duplicate | Low |
| HTL-62 | Cancel hidden once Confirmed | Take a booking to Confirmed status → open booking details | Cancel button/option does not appear anywhere; any direct cancel attempt is rejected | Critical |

## G. Additional Negative/Boundary (HTL-54 → HTL-61)

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| HTL-54 | Invalid card number | Enter an invalid card number at payment → submit | Payment declined with a clear error message | High |
| HTL-55 | Expired card | Enter an expired card's details → submit | Validation error shown | Medium |
| HTL-56 | Payment gateway timeout | Simulate slow/dropped network during payment | Timeout error shown with a retry option | Medium |
| HTL-57 | App/tab closed mid-payment | Close the tab/app while payment is processing | No orphaned or partial booking is created | Medium |
| HTL-58 | Guest count exceeds max at search | At search, attempt to set guest count above the allowed max | Blocked with a clear message | High |
| HTL-59 | Child age out of range | Enter a child age outside the valid range (e.g. negative or >17) | Validation error shown | High |
| HTL-60 | Modify Search | From results page, click "Modify Search" → change criteria → re-search | Search re-runs correctly with the updated criteria | Critical |
| HTL-61 | Special requests field | Enter free text in special requests/remarks field → submit | Text is accepted and persists through to the booking | Low |

---

**Total: 60 test cases**
