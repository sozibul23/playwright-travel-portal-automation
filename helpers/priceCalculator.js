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
 * Calculates expected Fees / Markup based on FMG configuration
 * Fees = (BaseFare * baseMarkup% + fixedBaseMarkup) + (Tax * taxMarkup% + fixedTaxMarkup)
 * @param {number} baseFare - Base fare amount
 * @param {number} tax - Tax amount
 * @param {Object} fmgConfig - FMG markup config (percents and fixed amounts)
 * @returns {number} Calculated total fees / markup
 */
export function calculateFees(baseFare, tax = 0, fmgConfig = {}) {
  const baseFareMarkupPercent = fmgConfig.baseFareMarkupPercent ?? 0;
  const baseFareFixedMarkup = fmgConfig.baseFareFixedMarkup ?? 0;
  const taxMarkupPercent = fmgConfig.taxMarkupPercent ?? 0;
  const taxFixedMarkup = fmgConfig.taxFixedMarkup ?? 0;

  const baseFareFee = (baseFare * baseFareMarkupPercent) / 100 + baseFareFixedMarkup;
  const taxFee = (tax * taxMarkupPercent) / 100 + taxFixedMarkup;
  return parseFloat((baseFareFee + taxFee).toFixed(2));
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
 * Calculates expected sub total: Base Fare + Taxes + AIT + Fees - Discount
 * @param {number} baseFare 
 * @param {number} tax 
 * @param {number} ait 
 * @param {number} fees 
 * @param {number} discount 
 * @returns {number} Sub Total
 */
export function calculateSubTotal(baseFare, tax = 0, ait = 0, fees = 0, discount = 0) {
  return parseFloat(((baseFare || 0) + (tax || 0) + (ait || 0) + (fees || 0) - (discount || 0)).toFixed(2));
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

/**
 * Checks if calculated fee matches displayed fee within tolerance.
 * @param {number} actualFee - Fees shown on portal UI
 * @param {number} expectedFee - Formula calculated fee
 * @param {number} tolerance - Allowable difference for rounding (default 2.0 BDT)
 * @returns {boolean} True if within tolerance
 */
export function verifyFeeWithinTolerance(actualFee, expectedFee, tolerance = 2.0) {
  return Math.abs(actualFee - expectedFee) <= tolerance;
}

