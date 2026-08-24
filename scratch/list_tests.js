import fs from 'fs';
import path from 'path';

const testsDir = './tests/flights';
const files = fs.readdirSync(testsDir).filter(f => f.endsWith('.spec.js'));

console.log('=== SUPPLIER TEST SUITE LIST (@supplier TAGGED TESTS) ===\n');

let totalCount = 0;

files.sort().forEach(file => {
  if (file === '01-auth.spec.js') return; // Supplier projects ignore auth spec file as configured in playwright.config.js
  
  const content = fs.readFileSync(path.join(testsDir, file), 'utf8');
  const matches = Array.from(content.matchAll(/test\((['"`])(.*?)\1/g));
  const supplierTests = matches.filter(m => m[2].includes('@supplier'));
  
  if (supplierTests.length > 0) {
    console.log(`📂 FILE: ${file} (${supplierTests.length} tests)`);
    supplierTests.forEach((m, idx) => {
      totalCount++;
      console.log(`   ${idx + 1}. ${m[2]}`);
    });
    console.log('');
  }
});

console.log(`Total Active Supplier Tests: ${totalCount}`);
