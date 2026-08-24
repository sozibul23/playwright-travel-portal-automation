import fs from 'fs';
import path from 'path';

const dir = './allure-results';
const files = fs.readdirSync(dir).filter(f => f.endsWith('-result.json'));

const results = [];
files.forEach(file => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    results.push(data);
  } catch(e) {}
});

['supplier-atlas', 'supplier-travelrobot', 'supplier-yuehang'].forEach(proj => {
  const projResults = results.filter(r => {
    const parentSuite = r.labels?.find(l => l.name === 'parentSuite')?.value;
    return parentSuite === proj;
  });

  console.log(`\n==================================================`);
  console.log(`📌 SUPPLIER PROJECT: ${proj.toUpperCase()}`);
  console.log(`==================================================`);
  if (projResults.length === 0) {
    console.log('No test execution results found.');
    return;
  }

  const latestStop = Math.max(...projResults.map(r => r.stop || 0));
  console.log(`Last Execution: ${new Date(latestStop).toLocaleString()}`);

  const latestTests = {};
  projResults.sort((a, b) => (b.stop || 0) - (a.stop || 0)).forEach(t => {
    if (!latestTests[t.name]) {
      latestTests[t.name] = t;
    }
  });

  const tests = Object.values(latestTests);
  const passed = tests.filter(t => t.status === 'passed').length;
  const failed = tests.filter(t => t.status === 'failed').length;
  const broken = tests.filter(t => t.status === 'broken').length;
  const skipped = tests.filter(t => t.status === 'skipped').length;

  console.log(`Unique Test Cases: ${tests.length} | Passed: ${passed} | Failed: ${failed} | Broken: ${broken} | Skipped: ${skipped}`);
  console.log('\n--- Test Breakdown ---');
  tests.forEach(t => {
    const icon = t.status === 'passed' ? '✅' : t.status === 'failed' ? '❌' : t.status === 'broken' ? '💥' : '⚠️';
    console.log(`${icon} [${t.status.toUpperCase()}] ${t.name}`);
    if (t.status === 'failed' || t.status === 'broken') {
      console.log(`   └ Error: ${t.statusDetails?.message?.split('\n')[0]}`);
    }
  });
});
