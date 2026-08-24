import { BasePage } from './BasePage.js';

export class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.usernameInput = page.getByRole('textbox', { name: /username/i })
      .or(page.getByPlaceholder(/username/i))
      .or(page.locator('input[name="username"], input[name="email"]'))
      .filter({ visible: true })
      .first();

    this.passwordInput = page.getByRole('textbox', { name: /password/i })
      .or(page.getByPlaceholder(/password/i))
      .or(page.locator('input[type="password"]'))
      .filter({ visible: true })
      .first();

    this.loginButton = page.getByRole('button', { name: /log in|login|sign in/i })
      .or(page.locator('button[type="submit"]'))
      .filter({ visible: true })
      .first();
  }

  async goto() {
    await this.page.goto('/login', { waitUntil: 'domcontentloaded' }).catch(() => {});
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async login(username, password) {
    // 1. If already on Home page with active session, return immediately
    const isSearchBtnVisible = await this.page.getByRole('button', { name: 'Search' }).first().isVisible().catch(() => false);
    if (isSearchBtnVisible && !this.page.url().includes('login')) {
      console.log('Search button visible on home page. Skipping login.');
      return;
    }

    // 2. Ensure we are on /login page if not already
    if (!this.page.url().includes('login')) {
      await this.goto();
    }

    // 3. Locate & fill Username input
    const usernameBox = this.page.locator('input[name="username"], input[name="email"], input[placeholder*="Username" i], input[placeholder*="Email" i], input[type="text"]:not([readonly])')
      .or(this.page.getByRole('textbox', { name: /username/i }))
      .filter({ visible: true })
      .first();

    await usernameBox.waitFor({ state: 'visible', timeout: 20000 });
    await usernameBox.click({ force: true }).catch(() => {});
    await usernameBox.fill(username);
    await usernameBox.dispatchEvent('input').catch(() => {});

    // 4. Locate & fill Password input
    const passwordBox = this.page.locator('input[name="password"], input[type="password"]')
      .or(this.page.getByRole('textbox', { name: /password/i }))
      .filter({ visible: true })
      .first();

    await passwordBox.click({ force: true }).catch(() => {});
    await passwordBox.fill(password);
    await passwordBox.dispatchEvent('input').catch(() => {});
    await this.page.waitForTimeout(300);

    // 5. Click Login button
    const loginBtn = this.page.locator('button[type="submit"]')
      .or(this.page.getByRole('button', { name: /log in|login|sign in/i }))
      .filter({ visible: true })
      .first();

    await loginBtn.waitFor({ state: 'enabled', timeout: 10000 }).catch(() => {});
    await loginBtn.click({ force: true }).catch(() => loginBtn.evaluate(el => el.click()));
    await this.page.waitForURL((url) => !url.href.includes('login'), { timeout: 20000 }).catch(() => {});
    await this.page.getByRole('button', { name: 'Search' }).first().waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
  }

  // Negative test এর জন্য — login fail হওয়ার পরও exception না ছুঁড়ে
  // current page state এ থেকে যায়, যাতে error/validation assert করা যায়।
  async loginExpectingFailure(username, password) {
    await this.waitAndFill(this.usernameInput, username);
    await this.waitAndFill(this.passwordInput, password);
    await this.waitAndClick(this.loginButton);
  }
}
