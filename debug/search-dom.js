import fs from 'fs';

const html = fs.readFileSync('debug/booking-details-dom.html', 'utf8');

// Find all matches of text inside elements
console.log('Searching for PNR or Booking Id text matches:');
const bookingIdMatch = html.match(/FL26[A-Z0-9]+/g);
console.log('Booking IDs found:', bookingIdMatch);

console.log('\nSearching for common B2B confirmation terms (Issue, Ticket, Voucher, Print, Hold, Payment):');
const terms = ['issue', 'ticket', 'voucher', 'print', 'hold', 'payment', 'pnr', 'status'];
terms.forEach(term => {
  const regex = new RegExp(`[^<>\n]*${term}[^<>\n]*`, 'gi');
  const matches = html.match(regex) || [];
  const uniqueMatches = [...new Set(matches.map(m => m.trim()))].slice(0, 10);
  console.log(`- Term "${term}" matches (up to 10 unique):`, uniqueMatches);
});

console.log('\nLooking for PDF or download links:');
const links = html.match(/href="[^"]*(pdf|download|ticket|voucher)[^"]*"/gi) || [];
console.log('Links found:', links);
