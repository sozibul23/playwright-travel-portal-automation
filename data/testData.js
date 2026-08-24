import { faker } from '@faker-js/faker';

export function generateRandomPassenger() {
  const firstName = faker.person.firstName().toUpperCase();
  const lastName = faker.person.lastName().toUpperCase();
  return {
    firstName,
    lastName,
    passportNumber: 'A' + faker.string.numeric(9),
    mobile: '07' + faker.string.numeric(9),
    email: faker.internet.email({ firstName, lastName }).toLowerCase()
  };
}

export function generateRandomHotelGuest() {
  const firstName = faker.person.firstName().toUpperCase();
  const lastName = faker.person.lastName().toUpperCase();
  return {
    firstName,
    lastName,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    mobile: '017' + faker.string.numeric(8)
  };
}

export function generateRandomHotelGuests(count = 2) {
  const guests = [];
  for (let i = 0; i < count; i++) {
    guests.push(generateRandomHotelGuest());
  }
  return guests;
}

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────
// Credentials MUST be provided via .env file (see .env.example).
// Do NOT add hardcoded fallback values here — that risks committing real passwords to git.
function requireEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[Config Error] Environment variable "${key}" is required but not set. ` +
      `Please copy .env.example to .env and fill in your credentials.`
    );
  }
  return value;
}

export const credentials = {
  username: requireEnv('TEST_USERNAME'),
  password: requireEnv('TEST_PASSWORD'),
};

// ─────────────────────────────────────────────
// Flight Data
// ─────────────────────────────────────────────
export function generateRandomFutureDate(minDaysAhead = 15, maxDaysAhead = 30) {
  const daysAhead = Math.floor(Math.random() * (maxDaysAhead - minDaysAhead + 1)) + minDaysAhead;
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return `${months[date.getMonth()]} ${date.getDate()},`;
}

const baseDays = Math.floor(Math.random() * 21) + 20; // 20 to 40 days

export const oneWayFlightData = {
  originCode: 'dac',
  originDisplay: 'Dhaka - Bangladesh',
  destinationCode: 'del',
  destinationDisplay: 'New Delhi - India',
  departureDate: generateRandomFutureDate(baseDays, baseDays),
  supplier: process.env.SUPPLIER || 'TravelRobotFlight-Sandbox',
};

export const roundTripFlightData = {
  originCode: 'dac',
  originDisplay: 'Dhaka - Bangladesh',
  destinationCode: 'sin',
  destinationDisplay: 'Singapore - Singapore',
  departureDate: generateRandomFutureDate(15, 20),
  returnDate: generateRandomFutureDate(25, 30),
  supplier: process.env.SUPPLIER || 'TravelRobotFlight-Sandbox',
};

export const multiCityFlightData = {
  leg1: {
    originCode: 'dac',
    originDisplay: 'Dhaka - Bangladesh',
    destinationCode: 'bkk',
    destinationDisplay: 'Suvarnabhumi Airport',
    departureDate: generateRandomFutureDate(15, 18),
  },
  leg2: {
    originCode: 'bkk',
    originDisplay: 'Suvarnabhumi Airport',
    destinationCode: 'sin',
    destinationDisplay: 'Singapore - Singapore',
    departureDate: generateRandomFutureDate(22, 25),
  },
  supplier: process.env.SUPPLIER || 'TravelRobotFlight-Sandbox',
};

export const passengerData = {
  adult: generateRandomPassenger(),
  child: generateRandomPassenger(),
  infant: generateRandomPassenger(),
};

// ─────────────────────────────────────────────
// Hotel Data
// ─────────────────────────────────────────────
export function generateRandomHotelDates(minDaysAhead = 15, maxDaysAhead = 30, stayNights = 2) {
  const daysAhead = Math.floor(Math.random() * (maxDaysAhead - minDaysAhead + 1)) + minDaysAhead;
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + daysAhead);

  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + stayNights);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return {
    checkInDateLabel: `${months[checkIn.getMonth()]} ${checkIn.getDate()},`,
    checkOutDateLabel: `${months[checkOut.getMonth()]} ${checkOut.getDate()},`,
    checkInDate: checkIn,
    checkOutDate: checkOut
  };
}

const defaultHotelDates = generateRandomHotelDates(15, 25, 2);

export const hotelSearchData = {
  destinationQuery: 'dhaka',
  destinationDisplay: 'Dhaka - Bangladesh',
  checkInDateLabel: defaultHotelDates.checkInDateLabel,
  checkOutDateLabel: defaultHotelDates.checkOutDateLabel,
  rooms: 1,
  adults: 2,
};

export const hotelTwoPaxData = {
  destinationQuery: 'dhaka',
  destinationDisplay: 'Dhaka - Bangladesh',
  checkInDateLabel: defaultHotelDates.checkInDateLabel,
  checkOutDateLabel: defaultHotelDates.checkOutDateLabel,
  rooms: 1,
  adults: 2,
  guests: generateRandomHotelGuests(2)
};

export const hotelTwoPaxOneInfantData = {
  destinationQuery: 'dhaka',
  destinationDisplay: 'Dhaka - Bangladesh',
  checkInDateLabel: defaultHotelDates.checkInDateLabel,
  checkOutDateLabel: defaultHotelDates.checkOutDateLabel,
  rooms: 1,
  adults: 2,
  children: 1,
  childAge: 1,
  guests: generateRandomHotelGuests(3)
};

export const multiRoomHotelData = {
  destinationQuery: 'dhaka',
  destinationDisplay: 'Dhaka - Bangladesh',
  checkInDateLabel: defaultHotelDates.checkInDateLabel,
  checkOutDateLabel: defaultHotelDates.checkOutDateLabel,
  rooms: 2,
  adults: 3,
  guests: generateRandomHotelGuests(3)
};

export const hotelGuestData = generateRandomHotelGuest();

export const multiRoomGuestData = generateRandomHotelGuests(2);

export const invalidHotelGuestData = {
  empty: { firstName: '', lastName: '', email: '', mobile: '' },
  invalidEmail: { ...hotelGuestData, email: 'abc@' },
  invalidMobile: { ...hotelGuestData, mobile: 'abc12345' },
  numericName: { firstName: '12345', lastName: '67890' },
  negativeAge: -5,
};

export const hotelCommissionConfig = {
  baseFarePercent: 5,
  taxPercent: 0,
  tolerance: 2.0,
};

export const commissionConfig = {
  defaultPercent: 7.0,
  taxPercent: 0,
};

export const commissionTolerance = 2.0;


