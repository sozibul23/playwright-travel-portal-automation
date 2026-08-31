import { chromium } from '@playwright/test';

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Md Sozibul Islam - SQA Resume</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    @page {
      size: A4;
      margin: 10mm 12mm 10mm 12mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.38;
      font-size: 9.3pt;
      -webkit-print-color-adjust: exact;
    }

    a {
      color: #1d4ed8;
      text-decoration: none;
    }

    .header {
      border-bottom: 2.5px solid #2563eb;
      padding-bottom: 6px;
      margin-bottom: 9px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .header-left h1 {
      font-size: 21pt;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.5px;
      line-height: 1.1;
      margin-bottom: 3px;
    }

    .header-left .title {
      font-size: 10.8pt;
      font-weight: 600;
      color: #2563eb;
    }

    .header-right {
      text-align: right;
      font-size: 8.6pt;
      color: #475569;
      line-height: 1.45;
    }

    .header-right a {
      color: #1e40af;
      font-weight: 600;
    }

    .section {
      margin-bottom: 9px;
    }

    .section-title {
      font-size: 10.2pt;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      border-bottom: 1.2px solid #cbd5e1;
      padding-bottom: 2px;
      margin-bottom: 5px;
      display: flex;
      align-items: center;
    }

    .objective-text {
      color: #334155;
      font-size: 9pt;
      text-align: justify;
    }

    /* Skills Grid */
    .skills-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 3.5px;
      font-size: 8.9pt;
    }

    .skill-row {
      display: flex;
      gap: 6px;
    }

    .skill-category {
      font-weight: 600;
      color: #0f172a;
      min-width: 145px;
      flex-shrink: 0;
    }

    .skill-desc {
      color: #334155;
      flex: 1;
    }

    /* Job & Project Items */
    .item {
      margin-bottom: 7px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 1px;
    }

    .item-title {
      font-size: 9.6pt;
      font-weight: 700;
      color: #0f172a;
    }

    .item-company {
      font-weight: 600;
      color: #2563eb;
    }

    .item-tech {
      font-size: 8.3pt;
      font-style: italic;
      color: #475569;
      margin-bottom: 2px;
    }

    .item-date {
      font-size: 8.5pt;
      font-weight: 500;
      color: #64748b;
      white-space: nowrap;
    }

    ul.bullet-list {
      list-style-type: disc;
      padding-left: 14px;
      margin-top: 1px;
    }

    ul.bullet-list li {
      font-size: 8.85pt;
      color: #334155;
      margin-bottom: 1.5px;
      line-height: 1.32;
    }

    ul.bullet-list li strong {
      color: #0f172a;
    }

    /* Education Table */
    .edu-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.6pt;
      margin-top: 2px;
    }

    .edu-table th {
      background-color: #f8fafc;
      color: #0f172a;
      font-weight: 600;
      text-align: left;
      padding: 3.5px 6px;
      border: 1px solid #cbd5e1;
    }

    .edu-table td {
      padding: 3.5px 6px;
      border: 1px solid #e2e8f0;
      color: #334155;
    }

    .badge-star {
      display: inline-block;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      padding: 0.5px 4px;
      border-radius: 3px;
      font-size: 7.5pt;
      font-weight: 600;
      margin-left: 4px;
    }

    .cert-item {
      font-size: 8.6pt;
      color: #334155;
      margin-bottom: 2px;
    }

    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .ref-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 5px 8px;
      border-radius: 4px;
      font-size: 8.3pt;
      line-height: 1.35;
    }

    .ref-name {
      font-weight: 700;
      color: #0f172a;
    }

    .ref-role {
      color: #475569;
    }

    .page-separator {
      page-break-before: always;
      break-before: page;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <header class="header">
    <div class="header-left">
      <h1>Md Sozibul Islam (Sadhin)</h1>
      <div class="title">Software Quality Assurance (SQA) Engineer | SDET</div>
    </div>
    <div class="header-right">
      <div>📍 Mirpur 12, Dhaka, Bangladesh &nbsp;|&nbsp; 📞 +8801740074251</div>
      <div>✉️ <a href="mailto:sozibul23@gmail.com">sozibul23@gmail.com</a></div>
      <div>
        🔗 <a href="https://linkedin.com/in/md-sozibul-islam" target="_blank">linkedin.com/in/md-sozibul-islam</a> &nbsp;|&nbsp; 
        🐙 <a href="https://github.com/sozibul23" target="_blank">github.com/sozibul23</a>
      </div>
    </div>
  </header>

  <!-- Objective -->
  <section class="section">
    <div class="section-title">Career Objective</div>
    <p class="objective-text">
      Results-driven Software Quality Assurance (SQA) Engineer with proven expertise in architecting resilient End-to-End (E2E) test automation frameworks, API testing, and performance engineering. Demonstrated proficiency in <strong>Playwright</strong>, <strong>Selenium</strong>, <strong>Page Object Model (POM)</strong>, and <strong>CI/CD pipelines</strong>, dedicated to ensuring high stability, scalability, and defect-free delivery for enterprise web and mobile applications.
    </p>
  </section>

  <!-- Technical Skills -->
  <section class="section">
    <div class="section-title">Technical Skills</div>
    <div class="skills-grid">
      <div class="skill-row">
        <span class="skill-category">Test Automation:</span>
        <span class="skill-desc">Playwright, Selenium WebDriver, Appium, Page Object Model (POM), Custom Test Fixtures, Data-Driven Testing</span>
      </div>
      <div class="skill-row">
        <span class="skill-category">Languages & Scripting:</span>
        <span class="skill-desc">JavaScript (Node.js / ESM), Java, Python, C/C++, SQL</span>
      </div>
      <div class="skill-row">
        <span class="skill-category">API & Performance:</span>
        <span class="skill-desc">REST Assured, Postman, Apache JMeter, Newman</span>
      </div>
      <div class="skill-row">
        <span class="skill-category">Reporting & CI/CD:</span>
        <span class="skill-desc">Allure Reporting (Single-File Standalone), GitHub Actions, Playwright HTML Reporter</span>
      </div>
      <div class="skill-row">
        <span class="skill-category">Core QA Methodologies:</span>
        <span class="skill-desc">SDLC, STLC, Agile / Scrum, Test Planning, Test Case Design, Defect Lifecycle Management, Boundary Value Analysis</span>
      </div>
      <div class="skill-row">
        <span class="skill-category">Tools & Databases:</span>
        <span class="skill-desc">Git / GitHub, Jira, MySQL, SQL Server, Oracle, Charles Proxy</span>
      </div>
    </div>
  </section>

  <!-- Work Experience -->
  <section class="section">
    <div class="section-title">Work Experience</div>

    <div class="item">
      <div class="item-header">
        <div>
          <span class="item-title">Associate SQA Engineer</span> &nbsp;—&nbsp; <span class="item-company">Innovate Solution</span>, Dhaka
        </div>
        <span class="item-date">April 2025 – Present</span>
      </div>
      <ul class="bullet-list">
        <li>Architected scalable <strong>E2E Automation Frameworks</strong> using <strong>Playwright</strong> & <strong>Selenium</strong> for enterprise B2B & B2C travel platforms.</li>
        <li>Automated <strong>120+ end-to-end test scenarios</strong> covering multi-layer flight booking pipelines, dynamic promo engines, and hotel reservations.</li>
        <li>Reduced regression testing cycle duration by <strong>60%</strong> through parallel worker execution, session caching (<code>storageState</code>), and scheduled <strong>GitHub Actions</strong> CI/CD.</li>
        <li>Conducted comprehensive <strong>REST API testing</strong> using Postman and REST Assured, verifying schema validations, token auth, and response latencies.</li>
        <li>Automated mobile test workflows using <strong>Appium</strong> and performed performance load testing using <strong>Apache JMeter</strong> to identify server bottlenecks.</li>
        <li>Actively participated in Agile Scrum ceremonies, sprint planning, and defect triage; logged and tracked bug lifecycles in <strong>Jira</strong>.</li>
      </ul>
    </div>

    <div class="item">
      <div class="item-header">
        <div>
          <span class="item-title">Intern, Software Test Engineer</span> &nbsp;—&nbsp; <span class="item-company">Business Automation Ltd</span>, Dhaka
        </div>
        <span class="item-date">Nov 2024 – Jan 2025</span>
      </div>
      <ul class="bullet-list">
        <li>Authored detailed test plans, scenarios, and test cases mapped to functional specifications and SRS documents.</li>
        <li>Executed manual functional, sanity, regression, and cross-browser testing across multiple web applications.</li>
        <li>Reported and tracked defects with clear reproduction steps, screenshots, and logs; conducted fix verifications and regression passes.</li>
      </ul>
    </div>
  </section>

  <!-- Projects (Starts on Clean Flow) -->
  <section class="section">
    <div class="section-title">Key Projects & Automation Frameworks</div>

    <!-- Project 1 -->
    <div class="item">
      <div class="item-header">
        <div>
          <span class="item-title">1. Enterprise Travel Portal E2E QA Automation Framework</span>
          <span class="badge-star">Featured Flagship</span>
        </div>
        <span class="item-date"><a href="https://github.com/sozibul23/playwright-travel-portal-automation" target="_blank">GitHub Repository ↗</a></span>
      </div>
      <div class="item-tech">Tech Stack: JavaScript (ESM), Playwright, Page Object Model (POM), Allure Reporting, GitHub Actions CI/CD</div>
      <ul class="bullet-list">
        <li><strong>Dual-Portal Automation:</strong> Engineered an enterprise framework automating complete user journeys across both <strong>B2B Agent</strong> and <strong>B2C Consumer</strong> travel portals (<strong>120+ automated scenarios</strong>).</li>
        <li><strong>7-Layer Flight Pipeline:</strong> Automated search validation, complex layover/duration math, airline filters, commission deductions, passenger forms, and PNR ticket generation.</li>
        <li><strong>Dynamic Promo Engine:</strong> Built data-driven validation for 14+ coupon edge cases (flat/percentage discounts, route rules, minimum order constraints, and zero-floor financial safety rules).</li>
        <li><strong>Multi-Supplier Matrix:</strong> Parameterized sandbox testing across <strong>Atlas, TravelRobot, and YueHang</strong> suppliers on Chromium and Firefox.</li>
        <li><strong>3-Tier Hotel Architecture:</strong> Designed a 46-test regression matrix validating complex 1–5 room multi-occupancy combinations and booking vouchers.</li>
        <li><strong>Zero-Dependency Reporting:</strong> Integrated <strong>Allure Single-File HTML Reports</strong> with embedded failure traces and screenshots for frictionless stakeholder sharing.</li>
      </ul>
    </div>

    <!-- Project 2 -->
    <div class="item">
      <div class="item-header">
        <div>
          <span class="item-title">2. Rokomari.com E-Commerce Playwright Automation Framework</span>
        </div>
        <span class="item-date"><a href="https://github.com/sozibul23/rokomari-playwright-automation" target="_blank">GitHub Repository ↗</a></span>
      </div>
      <div class="item-tech">Tech Stack: JavaScript / TypeScript, Playwright, Page Object Model (POM), Allure Reports, Cross-Browser Testing</div>
      <ul class="bullet-list">
        <li><strong>E-Commerce E2E Flow:</strong> Automated end-to-end shopping workflows on Bangladesh’s premier e-commerce bookstore, covering user auth, dynamic search, cart logic, and multi-step checkout.</li>
        <li><strong>Search & Filter Engine:</strong> Tested multi-criteria filters (Category, Author, Publisher, Price Range, and In-Stock toggle) with resilient element polling.</li>
        <li><strong>Cart & Price Calculations:</strong> Automated cart math, item quantity updates, delivery fee logic (Inside/Outside Dhaka), and promo discount calculations.</li>
        <li><strong>Data-Driven Checkout:</strong> Validated varied delivery address flows and payment gateways (Cash on Delivery, bKash, Digital Cards).</li>
        <li><strong>Reliability & Tracing:</strong> Eliminated test flakiness using Playwright auto-waits, custom fixtures, and automated trace/video capture on failures.</li>
      </ul>
    </div>

    <!-- Project 3 -->
    <div class="item">
      <div class="item-header">
        <div>
          <span class="item-title">3. API & Performance Testing Automation Suites</span>
        </div>
        <span class="item-date"><a href="https://github.com/sozibul23" target="_blank">GitHub Profile ↗</a></span>
      </div>
      <div class="item-tech">Tech Stack: Postman, Newman, REST Assured, Apache JMeter</div>
      <ul class="bullet-list">
        <li>Automated REST API collections validating authentication, status codes, payload structures, and response schema assertions.</li>
        <li>Designed JMeter performance test plans simulating concurrent user traffic to evaluate response times and server throughput.</li>
      </ul>
    </div>
  </section>

  <!-- Problem Solving & Research -->
  <section class="section" style="page-break-inside: avoid;">
    <div class="section-title">Problem Solving & Academic Research</div>
    <ul class="bullet-list">
      <li><strong>HackerRank SQL Practice:</strong> 4-Star Badge in SQL (Basic & Intermediate); solved 35+ complex database query problems. (<a href="https://www.hackerrank.com/profile/sozibul23" target="_blank">Profile Link ↗</a>)</li>
      <li><strong>Research (Team Lead):</strong> <em>"DES VS AES Algorithm Using Network Security and Cryptography"</em> — Achieved Grade 3.75 / 4.00 in CSE 4212 Research Methodology, Dept. of CSE, Varendra University.</li>
    </ul>
  </section>

  <!-- Education -->
  <section class="section" style="page-break-inside: avoid;">
    <div class="section-title">Educational Qualification</div>
    <table class="edu-table">
      <thead>
        <tr>
          <th>Degree / Certificate</th>
          <th>Major / Discipline</th>
          <th>Institution</th>
          <th>Result / GPA</th>
          <th>Year</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>B.Sc. in Engineering</strong></td>
          <td>Computer Science & Engineering</td>
          <td>Varendra University, Rajshahi</td>
          <td><strong>CGPA: 3.92 / 4.00</strong></td>
          <td>2024</td>
        </tr>
        <tr>
          <td><strong>HSC</strong></td>
          <td>Science</td>
          <td>Govt. City College, Rajshahi</td>
          <td>GPA: 4.58 / 5.00</td>
          <td>2018</td>
        </tr>
        <tr>
          <td><strong>SSC</strong></td>
          <td>Science</td>
          <td>Seroil Govt. High School, Rajshahi</td>
          <td>GPA: 5.00 / 5.00</td>
          <td>2016</td>
        </tr>
      </tbody>
    </table>
  </section>

  <!-- Certifications -->
  <section class="section" style="page-break-inside: avoid;">
    <div class="section-title">Certifications</div>
    <div class="cert-item">• <strong>Machine Learning Course</strong> — Certified by IBM (Instructor: Dr. Murthy Rallapalli) | <em>Sep 2023 – Oct 2023</em></div>
    <div class="cert-item">• <strong>SQA and Cyber Security</strong> — IT Training BD (US-based training organization) | <em>Mar 2022 – Dec 2022</em></div>
    <div class="cert-item">• <strong>Youth Leadership Training</strong> — Bangladesh Youth Leadership Center (BYLC) | <em>Apr 2021 – Jul 2021</em></div>
  </section>

  <!-- References -->
  <section class="section" style="page-break-inside: avoid;">
    <div class="section-title">References</div>
    <div class="two-col">
      <div class="ref-card">
        <div class="ref-name">Sabina Yasmin</div>
        <div class="ref-role">Coordinator, Dept. of Computer Science & Engineering</div>
        <div>Varendra University, Rajshahi, Bangladesh</div>
        <div>📞 +8801716793242 &nbsp;|&nbsp; ✉️ sabina@vu.edu.bd</div>
      </div>
      <div class="ref-card">
        <div class="ref-name">Md Khalid Saifullah</div>
        <div class="ref-role">Sr. SQA Engineer</div>
        <div>Portonics Ltd.</div>
        <div>📞 +8801758712517 &nbsp;|&nbsp; ✉️ arman8290@gmail.com</div>
      </div>
    </div>
  </section>

</body>
</html>
`;

async function generateResumePDF() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.setContent(htmlContent, { waitUntil: 'networkidle' });
  
  const destPath = 'C:\\Users\\sadhi\\Downloads\\Md_Sozibul_Islam_SQA_Resume.pdf';
  
  await page.pdf({
    path: destPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '10mm',
      bottom: '10mm',
      left: '12mm',
      right: '12mm'
    }
  });

  console.log(`✅ Resume PDF successfully generated at: ${destPath}`);
  await browser.close();
}

generateResumePDF().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
