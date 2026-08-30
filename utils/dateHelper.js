/**
 * dateHelper.js
 * Utility functions for generating dynamic future dates for test data.
 * Usage: import { getFutureDate } from '../../utils/dateHelper.js';
 */

/**
 * Returns a future date string in YYYY-MM-DD format.
 * @param {number} daysAhead - Number of days from today (default: 15)
 * @returns {string} e.g. "2026-10-12"
 */
export function getFutureDate(daysAhead = 15) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const year  = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day   = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns a past date string in YYYY-MM-DD format.
 * Useful for testing expired/past date validations.
 * @param {number} daysBehind - Number of days behind today (default: 5)
 * @returns {string} e.g. "2026-08-22"
 */
export function getPastDate(daysBehind = 5) {
  const date = new Date();
  date.setDate(date.getDate() - daysBehind);
  const year  = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day   = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns tomorrow's date in YYYY-MM-DD format.
 * @returns {string}
 */
export function getTomorrow() {
  return getFutureDate(1);
}

/**
 * Returns a standard one-way departure date for supplier API tests.
 * Uses 15 days ahead by default (avoids weekends optionally).
 * @param {string} [fallback] - Optional hardcoded date to use if dynamic fails
 * @returns {string}
 */
export function getSupplierTestDate(fallback) {
  try {
    return getFutureDate(15);
  } catch {
    return fallback || getFutureDate(15);
  }
}
