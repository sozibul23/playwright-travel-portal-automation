import fs from 'fs';
import path from 'path';

const dir = './allure-results';
const files = fs.readdirSync(dir).filter(f => f.endsWith('-result.json'));

const atlasBookingFailures = [];

files.forEach(file => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const parentSuite = data.labels?.find(l => l.name === 'parentSuite')?.value;
    const suite = data.labels?.find(l => l.name === 'suite')?.value;
    
    if (parentSuite === 'supplier-atlas' || (suite && suite.includes('06-booking'))) {
      if (data.status === 'failed' || data.status === 'broken') {
        atlasBookingFailures.push(data);
      }
    }
  } catch (e) {}
});

atlasBookingFailures.sort((a, b) => (b.stop || 0) - (a.stop || 0));

console.log(`Found ${atlasBookingFailures.length} failure logs for atlas/booking tests:\n`);

atlasBookingFailures.forEach((f, idx) => {
  console.log(`--- Failure #${idx + 1}: ${f.name} ---`);
  console.log(`Date: ${new Date(f.stop).toLocaleString()}`);
  console.log(`Status: ${f.status}`);
  console.log(`Error Message:\n${f.statusDetails?.message}\n`);
  if (f.statusDetails?.trace) {
    console.log(`Trace snippet:\n${f.statusDetails.trace.slice(0, 300)}\n`);
  }
});
