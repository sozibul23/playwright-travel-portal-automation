/**
 * priceCalculator.js
 * Hotel & Flight Commission and Pricing calculation utility functions.
 * 
 * Formula:
 * Commission = (BaseFare * baseFarePercent / 100) + (Tax * taxPercent / 100)
 * Payable Amount = Gross Total - Commission
 */

/**
 * Calculates commission based on base fare, tax, and percentage rates.
 * @param {number} baseFare - Base fare amount
 * @param {number} tax - Tax amount
 * @param {number} baseFarePercent - Commission percentage on base fare
 * @param {number} taxPercent - Commission percentage on tax
 * @returns {number} Calculated total commission
 */
export function calculateCommission(baseFare, tax = 0, baseFarePercent = 5, taxPercent = 0) {
  const baseFareCommission = (baseFare * baseFarePercent) / 100;
  const taxCommission = (tax * taxPercent) / 100;
  return baseFareCommission + taxCommission;
}

/**
 * Calculates net payable amount after deducting commission from total fare.
 * @param {number} totalFare - Gross total fare
 * @param {number} commission - Commission amount
 * @returns {number} Net payable amount
 */
export function calculateNetPayable(totalFare, commission) {
  return totalFare - commission;
}

/**
 * Checks if calculated commission matches displayed commission within tolerance.
 * @param {number} actualCommission - Commission shown on portal UI
 * @param {number} expectedCommission - Formula calculated commission
 * @param {number} tolerance - Allowable difference for rounding (default 2.0 BDT)
 * @returns {boolean} True if within tolerance
 */
export function verifyCommissionWithinTolerance(actualCommission, expectedCommission, tolerance = 2.0) {
  return Math.abs(actualCommission - expectedCommission) <= tolerance;
}
