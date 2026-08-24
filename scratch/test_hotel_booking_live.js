import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import { LoginPage } from '../pages/LoginPage.js';
import { HotelSearchPage } from '../pages/HotelSearchPage.js';
import { HotelDetailsPage } from '../pages/HotelDetailsPage.js';
import { HotelGuestFormPage } from '../pages/HotelGuestFormPage.js';
import { HotelBookingConfirmationPage } from '../pages/HotelBookingConfirmationPage.js';
import { generateRandomHotelGuest } from '../data/testData.js';

dotenv.config();

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const baseURL = process.env.BASE_URL || 'https://b2b.innovatedemo.com';
  console.log('1. Logging in...');
  await page.goto(baseURL + '/login');
  const loginPage = new LoginPage(page);
  await loginPage.login(
    process.env.TEST_USERNAME || 'sadhin123',
    process.env.TEST_PASSWORD || 'sadhin@innovatesolution.com'
  );

  console.log('2. Performing Hotel Search with optionIndex = 0 (City level)...');
  const hotelSearchPage = new HotelSearchPage(page);
  const hotelDetailsPage = new HotelDetailsPage(page);
  const hotelGuestFormPage = new HotelGuestFormPage(page);
  const hotelBookingConfirmationPage = new HotelBookingConfirmationPage(page);

  await hotelSearchPage.goToHotelTab();
  // Try optionIndex = 0 (1st city suggestion)
  await hotelSearchPage.selectDestination('dubai', null, 0);
  await hotelSearchPage.selectDates();
  await hotelSearchPage.selectSupplier('HotelBeds - Sandbox');
  await hotelSearchPage.clickSearch();

  console.log('3. Opening Hotel Details...');
  const detailPage = await hotelDetailsPage.openHotelDetailsTab(0);
  console.log('Detail Page URL:', detailPage.url());

  console.log('4. Selecting Room...');
  const roomSelected = await hotelDetailsPage.selectFirstRoom(detailPage);
  console.log('Room selected status:', roomSelected);

  if (roomSelected) {
    console.log('5. Filling Guest Details...');
    const guest = generateRandomHotelGuest();
    await hotelGuestFormPage.fillGuestDetails(detailPage, guest.firstName, guest.lastName);

    console.log('6. Accepting Terms & Pay & Reserve...');
    await hotelGuestFormPage.acceptTermsAndConditions(detailPage);
    await hotelGuestFormPage.clickPayAndReserve(detailPage);

    console.log('7. Verifying Booking Success...');
    const trackingId = await hotelBookingConfirmationPage.verifyBookingSuccess(detailPage);
    console.log('🎉 SUCCESS! Booking Tracking ID:', trackingId);
  }

  await browser.close();
})();
