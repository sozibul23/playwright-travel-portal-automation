/**
 * searchHelper.js
 *
 * Supplier test suite ?? ?? spec file ? ?????? ???? search block ?????
 * ???? shared helper functions?
 *
 * Usage:
 *   import { searchOneWay, searchRoundTrip } from '../../helpers/searchHelper.js';
 *
 *   // Basic one-way:
 *   await searchOneWay(page, oneWayFlightData);
 *
 *   // One-way with custom passengers:
 *   await searchOneWay(page, oneWayFlightData, { adults: 1, children: 1 });
 *
 *   // Round-trip:
 *   await searchRoundTrip(page, roundTripFlightData);
 */

import { FlightSearchPage } from '../pages/FlightSearchPage.js';

/**
 * One-way flight search ????
 *
 * @param {import('@playwright/test').Page} page       - Playwright page object
 * @param {object}  flightData                         - supplierTestData.oneWay (?? ?????? oneWay data)
 * @param {object|null} [passengers=null]              - optional { adults, children, infants }
 *
 * @example
 *   await searchOneWay(page, oneWayFlightData);
 *   await searchOneWay(page, oneWayFlightData, { adults: 2, children: 1, infants: 1 });
 */
export async function searchOneWay(page, flightData, passengers = null) {
  const searchPage = new FlightSearchPage(page);
  await searchPage.selectOneWay();
  await searchPage.setOriginByText(flightData.originCode, flightData.originDisplay);
  await searchPage.setDestinationByText(flightData.destinationCode, flightData.destinationDisplay);
  await searchPage.setDepartureDate(flightData.departureDate);
  if (passengers) {
    await searchPage.setPassengers(passengers);
  }
  await searchPage.selectSupplier(flightData.supplier);
  await searchPage.search();
}

/**
 * Round-trip flight search ????
 *
 * @param {import('@playwright/test').Page} page  - Playwright page object
 * @param {object}  flightData                    - supplierTestData.roundTrip
 *
 * @example
 *   await searchRoundTrip(page, roundTripFlightData);
 */
export async function searchRoundTrip(page, flightData) {
  const searchPage = new FlightSearchPage(page);
  await searchPage.selectRoundTrip();
  await searchPage.setOriginByText(flightData.originCode, flightData.originDisplay);
  await searchPage.setDestinationByText(flightData.destinationCode, flightData.destinationDisplay);
  await searchPage.setReturnDate(flightData.departureDate, flightData.returnDate);
  await searchPage.selectSupplier(flightData.supplier);
  await searchPage.search();
}
