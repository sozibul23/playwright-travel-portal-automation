import fs from 'fs';
import path from 'path';

const dir = './allure-results';
if (!fs.existsSync(dir)) {
  console.log('No allure-results dir');
  process.exit(0);
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('-result.json'));

files.forEach(file => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const parentSuite = data.labels?.find(l => l.name === 'parentSuite')?.value;
    const suite = data.labels?.find(l => l.name === 'suite')?.value;
    if ((parentSuite === 'supplier-yuehang' || (suite && suite.includes('06-booking'))) && data.name.includes('TC-015')) {
      console.log(`Test: ${data.name} | Status: ${data.status} | Stop: ${new Date(data.stop).toLocaleString()}`);
      console.log('Error Message:\n', data.statusDetails?.message);
      console.log('Trace:\n', data.statusDetails?.trace?.slice(0, 400));
      console.log('----------------------------------------------------');
    }
  } catch(e) {}
});
