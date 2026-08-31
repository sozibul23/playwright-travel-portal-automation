import { calculateFees, calculateCommission, calculateSubTotal } from '../helpers/priceCalculator.js';

export class FlightCommissionPage {
  constructor(page) {
    this.page = page;
  }

  // ── STEP 1: Search results লোড হওয়ার জন্য wait ─────────────────────────────
  async waitForResults() {
    const searchPendingBanner = this.page.getByText(/search is not completed/i).first();
    if (await searchPendingBanner.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchPendingBanner.waitFor({ state: 'hidden', timeout: 90000 }).catch(() => { });
    }

    const fareSummaryBtn = this.page
      .getByRole('button', { name: /Fare Summary/i })
      .or(this.page.locator('button:has-text("Fare Summary"), [role="button"]:has-text("Fare Summary"), a:has-text("Fare Summary")'))
      .first();

    await fareSummaryBtn.waitFor({ state: 'visible', timeout: 60000 });
  }

  // ── STEP 2: "Fare Summary" button ক্লিক করে popup খোলা ─────────────────────
  async openFareSummary() {
    const modal = this.page.locator('dialog[open], .modal[open], .modal.modal-open, .modal-box, div[role="dialog"]').first();
    if (await modal.isVisible({ timeout: 1000 }).catch(() => false)) {
      return; // Modal already open
    }

    // If Fare Breakdown table is already visible on the page, return
    const isBreakdownVisible = await this.page.getByText(/Fare Breakdown/i).first().isVisible({ timeout: 1000 }).catch(() => false);
    if (isBreakdownVisible) {
      return;
    }

    const btn = this.page.getByRole('button', { name: /Fare Summary/i })
      .or(this.page.locator('button:has-text("Fare Summary"), [role="button"]:has-text("Fare Summary"), a:has-text("Fare Summary")'))
      .first();
    await btn.waitFor({ state: 'visible', timeout: 15000 });
    await btn.click({ force: true });

    await this.page
      .getByText(/Fare Summary|Fare Breakdown/i)
      .first()
      .waitFor({ state: 'visible', timeout: 10000 });

    await this.page.waitForTimeout(600);
  }

  async openFareSummaryModal() {
    await this.openFareSummary();
  }


  // ── STEP 3: Fare Breakdown grid/table থেকে pax-wise data extract করা ────────
  async extractAllPaxFareSummary() {
    const rawData = await this.page.evaluate(() => {
      // 1. Look for container with "Fare Breakdown"
      const fareBreakdownHeader = Array.from(document.querySelectorAll('*')).find(el => 
        el.children.length === 0 && /Fare Breakdown/i.test(el.textContent || '')
      );
      
      const container = fareBreakdownHeader 
        ? (fareBreakdownHeader.closest('div.card, div.section, div.modal-box, dialog, div') || document.body)
        : document.body;

      // 2. Try HTML Table first with header detection
      const tables = Array.from(container.querySelectorAll('table'));
      for (const table of tables) {
        const headerRow = table.querySelector('thead tr') || table.querySelector('tr');
        const headerCells = headerRow 
          ? Array.from(headerRow.querySelectorAll('th, td')).map(c => (c.textContent || '').trim().toLowerCase()) 
          : [];
        
        const allTrs = Array.from(table.querySelectorAll('tr'));
        const bodyTrs = allTrs.filter(tr => tr !== headerRow);

        const rows = bodyTrs.map(tr => 
          Array.from(tr.querySelectorAll('th, td')).map(c => (c.textContent || '').trim())
        ).filter(r => r.length >= 3);

        if (rows.length >= 1) {
          return { headers: headerCells, allRows: rows };
        }
      }

      // 3. Try Modal / Popup text scan
      const modal = document.querySelector('dialog[open], .modal[open], .modal.modal-open, .modal-box, div[role="dialog"]');
      if (modal) {
        const modalTable = modal.querySelector('table');
        if (modalTable) {
          const headerRow = modalTable.querySelector('thead tr, tr:first-child');
          const headerCells = headerRow ? Array.from(headerRow.querySelectorAll('th, td')).map(c => (c.textContent || '').trim().toLowerCase()) : [];
          const rows = Array.from(modalTable.querySelectorAll('tr')).map(tr => 
            Array.from(tr.querySelectorAll('th, td')).map(c => (c.textContent || '').trim())
          ).filter(r => r.length >= 4);
          if (rows.length > 0) return { headers: headerCells, allRows: rows };
        }
      }

      // 4. Try CSS Grid / div rows under container
      const allDivs = Array.from(container.querySelectorAll('div'));
      for (const div of allDivs) {
        const text = div.innerText || '';
        if (/adult|child|infant/i.test(text) && /[\d,]+(\.\d+)?/.test(text)) {
          const directChildren = Array.from(div.children);
          if (directChildren.length >= 5) {
            const rowText = directChildren.map(c => (c.textContent || '').trim());
            return { 
              headers: ['pax type', 'base fare', 'taxes', 'ait', 'fees', 'discount', 'pax count', 'sub total'], 
              allRows: [rowText] 
            };
          }
        }
      }

      // 5. Try Sidebar Breakdown fallback
      const allElements = Array.from(document.querySelectorAll('div, aside, section'));
      const sidebar = allElements.find(el => /Fare\/Passenger Type/i.test(el.textContent || ''));
      if (sidebar) {
        const text = sidebar.innerText || '';
        const parseLine = (label) => {
          const regex = new RegExp(label + '\\s*[৳BDT\\s]*([\\d,]+(?:\\.\\d+)?)', 'i');
          const match = text.match(regex);
          return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
        };
        const baseFare = parseLine('Base\\s*Fare');
        const tax = parseLine('Tax');
        const ait = parseLine('AIT');
        const fees = parseLine('Fees');
        const discount = parseLine('Discount');
        const total = parseLine('Total');

        if (baseFare > 0) {
          return {
            headers: ['pax type', 'base fare', 'taxes', 'ait', 'fees', 'discount', 'pax count', 'sub total'],
            allRows: [['Adult', String(baseFare), String(tax), String(ait), String(fees), String(discount), '1', String(total)]]
          };
        }
      }

      return { error: 'No fare breakdown structure found' };
    });

    if (rawData.error || !rawData.allRows || rawData.allRows.length === 0) {
      console.log('⚠️ Fare Summary data row পাওয়া যায়নি, DOM scan:', rawData.error);
      return [];
    }

    const paxRows = [];
    const headers = rawData.headers || [];

    // Header index mapping if headers exist
    const baseFareIdx = headers.findIndex(h => h.includes('base'));
    const taxIdx = headers.findIndex(h => h.includes('tax'));
    const aitIdx = headers.findIndex(h => h.includes('ait'));
    const feesIdx = headers.findIndex(h => h.includes('fee'));
    const discountIdx = headers.findIndex(h => h.includes('discount') || h.includes('comm'));
    const countIdx = headers.findIndex(h => h.includes('count') || h.includes('pax count') || h.includes('qty'));
    const subTotalIdx = headers.findIndex(h => h.includes('sub total') || h.includes('total'));


    for (const row of rawData.allRows) {
      const rowText = row.join(' ').toLowerCase();
      let paxType = null;
      if (rowText.includes('adult') || rowText.includes('adt')) paxType = 'Adult';
      else if (rowText.includes('child') || rowText.includes('chd') || rowText.includes('c05')) paxType = 'Child';
      else if (rowText.includes('infant') || rowText.includes('inf')) paxType = 'Infant';
      if (!paxType) continue;

      let baseFare = 0, tax = 0, ait = 0, fees = 0, discount = 0, paxCount = 1, subTotal = 0;

      if (baseFareIdx !== -1 && row[baseFareIdx] !== undefined) {
        // Mapped by detected table headers: [Pax Type, Base Fare, Taxes, AIT, Fees, Discount, Pax Count, Sub Total]
        baseFare = this._parseAmount(row[baseFareIdx]) ?? 0;
        tax = taxIdx !== -1 ? (this._parseAmount(row[taxIdx]) ?? 0) : 0;
        ait = aitIdx !== -1 ? (this._parseAmount(row[aitIdx]) ?? 0) : 0;
        fees = feesIdx !== -1 ? (this._parseAmount(row[feesIdx]) ?? 0) : 0;
        discount = discountIdx !== -1 ? (this._parseAmount(row[discountIdx]) ?? 0) : 0;
        paxCount = countIdx !== -1 ? (parseInt(row[countIdx]) || 1) : 1;
        subTotal = subTotalIdx !== -1 ? (this._parseAmount(row[subTotalIdx]) ?? (baseFare + tax + ait + fees - discount)) : (baseFare + tax + ait + fees - discount);
      } else {
        // Fallback positional mapping for [PaxType, BaseFare, Taxes, AIT, Fees, Discount, PaxCount, SubTotal]
        const nonTextAmounts = row.map(c => this._parseAmount(c)).filter(n => n !== null);
        if (nonTextAmounts.length >= 6) {
          // Full 8-column layout (Adult, BaseFare, Taxes, AIT, Fees, Discount, PaxCount, SubTotal)
          baseFare = nonTextAmounts[0] ?? 0;
          tax = nonTextAmounts[1] ?? 0;
          ait = nonTextAmounts[2] ?? 0;
          fees = nonTextAmounts[3] ?? 0;
          discount = nonTextAmounts[4] ?? 0;
          paxCount = nonTextAmounts[5] ?? 1;
          subTotal = nonTextAmounts[6] ?? (baseFare + tax + ait + fees - discount);
        } else if (nonTextAmounts.length === 5) {
          baseFare = nonTextAmounts[0] ?? 0;
          tax = nonTextAmounts[1] ?? 0;
          fees = nonTextAmounts[2] ?? 0;
          discount = nonTextAmounts[3] ?? 0;
          subTotal = nonTextAmounts[4] ?? (baseFare + tax + fees - discount);
        } else if (nonTextAmounts.length >= 3) {
          baseFare = nonTextAmounts[0] ?? 0;
          tax = nonTextAmounts[1] ?? 0;
          discount = nonTextAmounts.length >= 4 ? (nonTextAmounts[2] ?? 0) : 0;
          subTotal = nonTextAmounts[nonTextAmounts.length - 1] ?? (baseFare + tax);
        }
      }

      paxRows.push({
        paxType,
        baseFare,
        tax,
        ait,
        fees,
        discount,
        paxCount,
        subTotal
      });
    }

    return paxRows;
  }

  // ── Helper: "৳ 20,971.54" / "৳0" → 20971.54 / 0 ─────────────────────────────
  _parseAmount(text) {
    if (text === undefined || text === null) return null;
    const clean = String(text).replace(/[৳,\s]/g, '').replace(/[^\d.-]/g, '');
    if (clean === '' || clean === '-') return null;
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
  }

  // ── STEP 4: Discount & Fees Verification ───────────────────────────────────
  verifyDiscountForAllPax(paxRows, commissionConfig = {}, { tolerance = 2.0 } = {}) {
    const results = { passed: true, paxResults: [] };

    if (!paxRows?.length) {
      results.passed = false;
      results.paxResults.push({ paxType: 'N/A', passed: false, reason: 'কোনো pax row পাওয়া যায়নি' });
      return results;
    }

    for (const row of paxRows) {
      const config = commissionConfig[row.paxType] || {
        baseFarePercent: commissionConfig.defaultPercent ?? 0,
        taxPercent: commissionConfig.taxPercent ?? 0,
      };

      const hasDiscount = row.discount !== null && row.discount > 0;
      const paxResult = {
        paxType: row.paxType,
        baseFare: row.baseFare,
        tax: row.tax,
        ait: row.ait || 0,
        fees: row.fees || 0,
        discount: row.discount || 0,
        subTotal: row.subTotal,
        passed: false,
        checks: [],
      };

      if (!hasDiscount) {
        const expectedZero = !config || (((config.baseFarePercent ?? 0) === 0) && ((config.taxPercent ?? 0) === 0));
        paxResult.passed = expectedZero;
        paxResult.checks.push({ name: 'Discount = 0', passed: expectedZero, value: row.discount, expected: 0, diff: 0 });
        results.paxResults.push(paxResult);
        if (!paxResult.passed) results.passed = false;
        continue;
      }

      const baseFareComponent = parseFloat(((row.baseFare ?? 0) * (config.baseFarePercent ?? 0) / 100).toFixed(2));
      const taxComponent = parseFloat(((row.tax ?? 0) * (config.taxPercent ?? 0) / 100).toFixed(2));
      const expectedDiscount = parseFloat((baseFareComponent + taxComponent).toFixed(2));
      const diff = Math.abs(row.discount - expectedDiscount);
      const calcMatch = diff <= tolerance;

      paxResult.checks.push({
        name: `Discount = ${config.baseFarePercent}% of BaseFare(${row.baseFare}) + ${config.taxPercent}% of Tax(${row.tax})`,
        passed: calcMatch,
        value: row.discount,
        expected: expectedDiscount,
        diff: parseFloat(diff.toFixed(2)),
        breakdown: { baseFareComponent, taxComponent },
      });

      paxResult.passed = calcMatch;
      results.paxResults.push(paxResult);
      if (!calcMatch) results.passed = false;
    }

    return results;
  }

  // ── STEP 5: Fees Verification (FMG Markup) ──────────────────────────────────
  verifyFeesForAllPax(paxRows, feesConfig = {}, { tolerance = 2.0 } = {}) {
    const results = { passed: true, paxResults: [] };

    if (!paxRows?.length) {
      results.passed = false;
      results.paxResults.push({ paxType: 'N/A', passed: false, reason: 'কোনো pax row পাওয়া যায়নি' });
      return results;
    }

    for (const row of paxRows) {
      const config = feesConfig[row.paxType] || feesConfig;
      const expectedFees = calculateFees(row.baseFare, row.tax, config);
      const diff = Math.abs((row.fees || 0) - expectedFees);
      const calcMatch = diff <= tolerance;

      const paxResult = {
        paxType: row.paxType,
        baseFare: row.baseFare,
        tax: row.tax,
        fees: row.fees || 0,
        expectedFees,
        passed: calcMatch,
        checks: [{
          name: `Fees / Markup (BaseMarkup: ${config.baseFareMarkupPercent ?? 0}%, FixedBase: ${config.baseFareFixedMarkup ?? 0}, TaxMarkup: ${config.taxMarkupPercent ?? 0}%)`,
          passed: calcMatch,
          value: row.fees || 0,
          expected: expectedFees,
          diff: parseFloat(diff.toFixed(2))
        }]
      };

      results.paxResults.push(paxResult);
      if (!calcMatch) results.passed = false;
    }

    return results;
  }

  // ── STEP 6: Full Fare Breakdown (BaseFare, Tax, AIT, Fees, Discount, SubTotal) 
  verifyFullFareBreakdown(paxRows, { commissionConfig = {}, feesConfig = {}, tolerance = 2.0 } = {}) {
    const discountRes = this.verifyDiscountForAllPax(paxRows, commissionConfig, { tolerance });
    const feesRes = this.verifyFeesForAllPax(paxRows, feesConfig, { tolerance });

    const results = {
      passed: discountRes.passed && feesRes.passed,
      paxResults: []
    };

    for (let i = 0; i < paxRows.length; i++) {
      const row = paxRows[i];
      const dResult = discountRes.paxResults[i];
      const fResult = feesRes.paxResults[i];

      const expectedSubTotal = calculateSubTotal(row.baseFare, row.tax, row.ait, row.fees, row.discount);
      const subTotalDiff = Math.abs((row.subTotal || 0) - expectedSubTotal);
      const subTotalMatch = subTotalDiff <= tolerance;

      const checks = [
        ...(dResult?.checks || []),
        ...(fResult?.checks || []),
        {
          name: `SubTotal = BaseFare(${row.baseFare}) + Taxes(${row.tax}) + AIT(${row.ait || 0}) + Fees(${row.fees || 0}) - Discount(${row.discount || 0})`,
          passed: subTotalMatch,
          value: row.subTotal,
          expected: expectedSubTotal,
          diff: parseFloat(subTotalDiff.toFixed(2))
        }
      ];

      const paxPassed = (dResult?.passed ?? true) && (fResult?.passed ?? true) && subTotalMatch;
      if (!paxPassed) results.passed = false;

      results.paxResults.push({
        paxType: row.paxType,
        baseFare: row.baseFare,
        tax: row.tax,
        ait: row.ait || 0,
        fees: row.fees || 0,
        discount: row.discount || 0,
        paxCount: row.paxCount || 1,
        subTotal: row.subTotal,
        passed: paxPassed,
        checks
      });
    }

    return results;
  }

  // ── STEP 7: Separate Reports for Commission and Fees ───────────────────────
  printDiscountVerificationReport(verificationResult) {
    console.log('\n' + '═'.repeat(65));
    console.log('  💰 [COMMISSION] FLIGHT COMMISSION & DISCOUNT VERIFICATION');
    console.log('═'.repeat(65));

    for (const p of verificationResult.paxResults) {
      console.log(`\n👤 Pax Type  : ${p.paxType}`);
      console.log(`   Base Fare : ৳ ${p.baseFare}`);
      console.log(`   Taxes     : ৳ ${p.tax}`);
      console.log(`   Discount  : ৳ ${p.discount ?? 0}`);
      for (const c of p.checks ?? []) {
        console.log(`   ${c.passed ? '✅' : '❌'} ${c.name}`);
        if (c.expected !== undefined) console.log(`      Got: ৳${c.value}  |  Expected: ৳${c.expected}  |  (diff: ${c.diff})`);
      }
    }

    console.log(`\n${'─'.repeat(65)}`);
    console.log(`  Commission Verification: ${verificationResult.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log('═'.repeat(65) + '\n');
  }

  printFeesVerificationReport(verificationResult) {
    console.log('\n' + '═'.repeat(65));
    console.log('  🏷️  [FEES & MARKUP] FLIGHT FEES (FMG) VERIFICATION');
    console.log('═'.repeat(65));

    for (const p of verificationResult.paxResults) {
      console.log(`\n👤 Pax Type  : ${p.paxType}`);
      console.log(`   Base Fare : ৳ ${p.baseFare}`);
      console.log(`   Taxes     : ৳ ${p.tax}`);
      console.log(`   Fees (UI) : ৳ ${p.fees ?? 0}`);
      for (const c of p.checks ?? []) {
        console.log(`   ${c.passed ? '✅' : '❌'} ${c.name}`);
        if (c.expected !== undefined) console.log(`      Got: ৳${c.value}  |  Expected: ৳${c.expected}  |  (diff: ${c.diff})`);
      }
    }

    console.log(`\n${'─'.repeat(65)}`);
    console.log(`  Fees Verification: ${verificationResult.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log('═'.repeat(65) + '\n');
  }

  // ── Full Fare Breakdown Report ─────────────────────────────────────────────
  printVerificationReport(verificationResult) {
    console.log('\n' + '═'.repeat(65));
    console.log('  ✈️  FLIGHT FARE, FEES & COMMISSION VERIFICATION REPORT');
    console.log('═'.repeat(65));

    for (const p of verificationResult.paxResults) {
      console.log(`\n👤 Pax Type  : ${p.paxType}`);
      console.log(`   Base Fare : ৳ ${p.baseFare}`);
      console.log(`   Taxes     : ৳ ${p.tax}`);
      if (p.ait !== undefined) console.log(`   AIT       : ৳ ${p.ait}`);
      console.log(`   Fees      : ৳ ${p.fees ?? 0}`);
      console.log(`   Discount  : ৳ ${p.discount ?? 0}`);
      console.log(`   Sub Total : ৳ ${p.subTotal}`);
      for (const c of p.checks ?? []) {
        console.log(`   ${c.passed ? '✅' : '❌'} ${c.name}`);
        if (c.expected !== undefined) console.log(`      Got: ৳${c.value}  |  Expected: ৳${c.expected}  |  (diff: ${c.diff})`);
      }
    }

    console.log(`\n${'─'.repeat(65)}`);
    console.log(`  Overall Result: ${verificationResult.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log('═'.repeat(65) + '\n');
  }
}


