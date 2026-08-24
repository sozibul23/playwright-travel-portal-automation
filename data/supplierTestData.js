import { generateRandomFutureDate } from './testData.js';

const baseDays = 25; // 25 days from today (stable for sandbox flight availability)

// ─────────────────────────────────────────────────────────────────────────────
// KNOWN SUPPLIERS MAP
// ─────────────────────────────────────────────────────────────────────────────
export const supplierConfigs = {
  atlas: {
    supplierName: 'Atlas SandBox - TripGic',
    oneWay: {
      originCode: 'dac',
      originDisplay: 'Dhaka - Bangladesh',
      destinationCode: 'del',
      destinationDisplay: 'New Delhi - India',
      departureDate: generateRandomFutureDate(baseDays, baseDays),
    },
    roundTrip: {
      originCode: 'dac',
      originDisplay: 'Dhaka - Bangladesh',
      destinationCode: 'del',
      destinationDisplay: 'New Delhi - India',
      departureDate: generateRandomFutureDate(baseDays, baseDays),
      returnDate: generateRandomFutureDate(baseDays + 3, baseDays + 3),
    },
    multiCity: [
      {
        originCode: 'dac',
        originDisplay: 'Dhaka - Bangladesh',
        destinationCode: 'del',
        destinationDisplay: 'New Delhi - India',
        departureDate: generateRandomFutureDate(baseDays, baseDays),
      },
      {
        originCode: 'del',
        originDisplay: 'New Delhi - India',
        destinationCode: 'dac',
        destinationDisplay: 'Dhaka - Bangladesh',
        departureDate: generateRandomFutureDate(baseDays + 3, baseDays + 3),
      }
    ]
  },
  travelrobot: {
    supplierName: 'TravelRobotFlight-Sandbox',
    oneWay: {
      originCode: 'dac',
      originDisplay: 'Dhaka - Bangladesh',
      destinationCode: 'del',
      destinationDisplay: 'New Delhi - India',
      departureDate: generateRandomFutureDate(baseDays, baseDays),
    },
    roundTrip: {
      originCode: 'dac',
      originDisplay: 'Dhaka - Bangladesh',
      destinationCode: 'del',
      destinationDisplay: 'New Delhi - India',
      departureDate: generateRandomFutureDate(baseDays, baseDays),
      returnDate: generateRandomFutureDate(baseDays + 3, baseDays + 3),
    },
    multiCity: [
      {
        originCode: 'dac',
        originDisplay: 'Dhaka - Bangladesh',
        destinationCode: 'del',
        destinationDisplay: 'New Delhi - India',
        departureDate: generateRandomFutureDate(baseDays, baseDays),
      },
      {
        originCode: 'del',
        originDisplay: 'New Delhi - India',
        destinationCode: 'dac',
        destinationDisplay: 'Dhaka - Bangladesh',
        departureDate: generateRandomFutureDate(baseDays + 3, baseDays + 3),
      }
    ]
  },
  yuehang: {
    supplierName: 'yuehang test',
    oneWay: {
      originCode: 'cai',
      originDisplay: 'Cairo - Egypt',
      destinationCode: 'ruh',
      destinationDisplay: 'King Khalid International',
      departureDate: generateRandomFutureDate(baseDays, baseDays),
    },
    roundTrip: {
      originCode: 'cai',
      originDisplay: 'Cairo - Egypt',
      destinationCode: 'ruh',
      destinationDisplay: 'King Khalid International',
      departureDate: generateRandomFutureDate(baseDays, baseDays),
      returnDate: generateRandomFutureDate(baseDays + 3, baseDays + 3),
    },
    multiCity: [
      {
        originCode: 'cai',
        originDisplay: 'Cairo - Egypt',
        destinationCode: 'ruh',
        destinationDisplay: 'King Khalid International',
        departureDate: generateRandomFutureDate(baseDays, baseDays),
      },
      {
        originCode: 'ruh',
        originDisplay: 'King Khalid International',
        destinationCode: 'cai',
        destinationDisplay: 'Cairo - Egypt',
        departureDate: generateRandomFutureDate(baseDays + 3, baseDays + 3),
      }
    ]
  }
};

/**
 * Dynamic fallback config helper.
 * If key is not in supplierConfigs, generates a fallback config for the supplier name.
 */
export function getSupplierConfig(key, displayName = '') {
  const normKey = key ? key.toLowerCase() : '';
  if (supplierConfigs[normKey]) {
    return supplierConfigs[normKey];
  }
  return {
    supplierName: displayName || key,
    oneWay: {
      originCode: 'dac',
      originDisplay: 'Dhaka - Bangladesh',
      destinationCode: 'dxb',
      destinationDisplay: 'DXB',
      departureDate: generateRandomFutureDate(baseDays, baseDays),
    },
    roundTrip: {
      originCode: 'dac',
      originDisplay: 'Dhaka - Bangladesh',
      destinationCode: 'del',
      destinationDisplay: 'New Delhi - India',
      departureDate: generateRandomFutureDate(baseDays, baseDays),
      returnDate: generateRandomFutureDate(baseDays + 3, baseDays + 3),
    },
    multiCity: [
      {
        originCode: 'dac',
        originDisplay: 'Dhaka - Bangladesh',
        destinationCode: 'del',
        destinationDisplay: 'New Delhi - India',
        departureDate: generateRandomFutureDate(baseDays, baseDays),
      },
      {
        originCode: 'del',
        originDisplay: 'New Delhi - India',
        destinationCode: 'dac',
        destinationDisplay: 'Dhaka - Bangladesh',
        departureDate: generateRandomFutureDate(baseDays + 3, baseDays + 3),
      }
    ]
  };
}
