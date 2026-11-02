import { generateRandomFutureDate } from './testData.js';

export const transferSearchData = {
  pickupQuery: 'dubai',
  pickupDisplay: 'Dubai, United Arab Emirates',
  dropoffQuery: 'dubai mall',
  dropoffDisplay: 'Dubai Mall - Dubai - United',
  dateLabel: generateRandomFutureDate(15, 25),
};

export const transferPassengerData = {
  firstName: 'Sadhin',
  lastName: 'Automated',
  mobile: '+966 712 343 535',
  email: 'sadhin@innovatesolution.com',
  note: 'Transfer test automated request',
  flightNumber: 'EK582',
  mode: 'FLIGHT',
  direction: 'ARRIVAL',
  carrierName: 'Emirates',
};

