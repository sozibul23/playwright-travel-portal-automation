import fs from 'fs';
import path from 'path';

const testsDir = './tests/flights';
const files = fs.readdirSync(testsDir).filter(f => f.endsWith('.spec.js') && f !== '01-auth.spec.js');

console.log('=== SUPPLIER PROJECT TEST LIST (RUNS FOR npm run test:yuehang / atlas / travelrobot) ===\n');

let totalCount = 0;

files.sort().forEach(file => {
  const content = fs.readFileSync(path.join(testsDir, file), 'utf8');
  const matches = Array.from(content.matchAll(/test\((['"`])(.*?)\1/g));
  
  console.log(`📂 FILE: ${file} (${matches.length} tests)`);
  matches.forEach((m, idx) => {
    totalCount++;
    console.log(`   ${idx + 1}. ${m[2]}`);
  });
  console.log('');
});

console.log(`Total Active Supplier Tests per Supplier Run: ${totalCount}`);
