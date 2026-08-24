/**
 * couponTestData.js
 * Centralized coupon test dataset representing all admin rule categories for B2B & B2C.
 */

// 🛫 Supported Flight Test Routes (Domestic + International)
export const flightCouponRoutes = [
  {
    from: 'dac',
    fromDisplay: 'Dhaka - Bangladesh',
    to: 'cxb',
    toDisplay: "Cox's Bazar - Bangladesh",
    type: 'domestic',
    description: 'DAC -> CXB (Domestic Flight Route)'
  },
  {
    from: 'dac',
    fromDisplay: 'Dhaka - Bangladesh',
    to: 'del',
    toDisplay: 'New Delhi - India',
    type: 'international',
    description: 'DAC -> DEL (International Flight Route)'
  }
];

export const flightCouponSuite = [
  // 1. 🟢 Active Fixed / Flat Discount (AUG27)
  {
    id: 'TC-CPN-01',
    code: 'AUG27',
    type: 'fixed',
    discount: 2000,
    expectedStatus: 'success',
    description: 'Flat 2000 Tk Discount',
  },

  // 2. 🔤 Case-Insensitive Check (aug27)
  {
    id: 'TC-CPN-02',
    code: 'aug27',
    type: 'case_insensitive',
    discount: 2000,
    expectedStatus: 'success',
    description: 'Case-Insensitive Input',
  },

  // 3. 🟢 Percentage Discount with Max Cap (10PERCENT)
  {
    id: 'TC-CPN-03',
    code: '10PERCENT',
    type: 'percentage',
    percentage: 10,
    maxDiscount: 25000,
    expectedStatus: 'success',
    description: '10% Percentage Discount',
  },

  // 4. 🛫 Domestic Flight Discount (DOMESTIC500 on Domestic)
  {
    id: 'TC-CPN-04A',
    code: 'DOMESTIC500',
    type: 'fixed',
    discount: 500,
    routeType: 'domestic',
    expectedStatus: 'success',
    description: 'Domestic Route (DAC ➔ CXB)',
  },

  // 5. 🚫 Domestic Coupon on International Route
  {
    id: 'TC-CPN-04B',
    code: 'DOMESTIC500',
    type: 'route_mismatch',
    routeType: 'international',
    expectedStatus: 'error',
    expectedMessage: /not applicable|domestic|invalid|not eligible|route|service/i,
    description: 'Reject on Intl Route (DAC ➔ DEL)',
  },

  // 6. 🌍 International Flight Discount (INTL1500 on Intl)
  {
    id: 'TC-CPN-05A',
    code: 'INTL1500',
    type: 'fixed',
    discount: 1500,
    routeType: 'international',
    expectedStatus: 'success',
    description: 'Intl Route (DAC ➔ DEL)',
  },

  // 7. 🚫 International Coupon on Domestic Route
  {
    id: 'TC-CPN-05B',
    code: 'INTL1500',
    type: 'route_mismatch',
    routeType: 'domestic',
    expectedStatus: 'error',
    expectedMessage: /not applicable|international|invalid|not eligible|route|service/i,
    description: 'Reject on Domestic Route (DAC ➔ CXB)',
  },

  // 8. 🔴 Expired Coupon (EXPIRED2026)
  {
    id: 'TC-CPN-06',
    code: 'EXPIRED2026',
    type: 'expired',
    expectedStatus: 'error',
    expectedMessage: /expired|invalid|inactive|not found|not eligible/i,
    description: 'Expired Date Block',
  },

  // 9. 🔴 Inactive Status Coupon (INACTIVE100)
  {
    id: 'TC-CPN-07',
    code: 'INACTIVE100',
    type: 'inactive',
    expectedStatus: 'error',
    expectedMessage: /inactive|invalid|disabled|disable|not found/i,
    description: 'Disabled Status Block',
  },

  // 10. 🟡 Minimum Order Value (MINORDER9999)
  {
    id: 'TC-CPN-08',
    code: 'MINORDER9999',
    type: 'min_spend_fail',
    expectedStatus: 'error',
    expectedMessage: /minimum|order value|not eligible|invalid|amount/i,
    description: 'Min Order 50,000 Block',
  },

  // 11. 🏨 Service Restriction (HOTELONLY)
  {
    id: 'TC-CPN-09',
    code: 'HOTELONLY',
    type: 'service_mismatch',
    expectedStatus: 'error',
    expectedMessage: /invalid|not applicable|hotel|service/i,
    description: 'Hotel Only Reject on Flight',
  },

  // 12. 🚫 Invalid Coupon Code (INVALIDCOUPON999)
  {
    id: 'TC-CPN-10',
    code: 'INVALIDCOUPON999',
    type: 'invalid',
    expectedStatus: 'error',
    expectedMessage: /invalid|not found|does not exist/i,
    description: 'Fake Code Invalid Error',
  },

  // 13. 🛡️ Non-Negative Check (AUG27)
  {
    id: 'TC-CPN-11',
    code: 'AUG27',
    type: 'non_negative_check',
    expectedStatus: 'success',
    description: 'Non-Negative Price Safety',
  },

  // 14. ⏱️ Global Usage Limit Expiry Cycle (LIMIT1)
  {
    id: 'TC-CPN-12',
    code: 'LIMIT1',
    type: 'usage_limit',
    expectedStatus: 'error',
    expectedMessage: /limit|exceeded|already used|redeemed|invalid|not found/i,
    description: 'Global Usage Limit Block',
  },
];
