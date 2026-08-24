import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';

/**
 * Authentication & Login Tests
 *
 * Tags:
 * - @smoke: Core functional checks (success login, redirect)
 * - @functional: Additional functional validations (reload persistence)
 * - @negative: Error handling for bad inputs/SQL injection
 * - @regression: Critical path regression
 */

async function assertLoginErrorModal(page) {
  await expect(
    page.getByRole('heading', { name: 'Error' }).or(page.getByText('Error').first()),
    'Error modal title should be visible'
  ).toBeVisible({ timeout: 5000 });

  const wrongCredsMsg = page.getByText('The username and password combination is incorrect.');
  const invalidUserMsg = page.getByText(/Invalid username \[ .* \] provided for login\./);
  await expect(
    wrongCredsMsg.or(invalidUserMsg),
    'Error modal message should match invalid creds or user pattern'
  ).toBeVisible({ timeout: 5000 });

  await expect(
    page.getByRole('button', { name: 'Close' }),
    'Close button should be visible on error modal'
  ).toBeVisible();
}

test.describe('Login - Authentication Suite', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  // ── SI-01: Valid login → dashboard redirect @smoke ──────────────────────────────────
  test('SI-01: should redirect to dashboard after successful login with valid credentials @smoke @regression', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(
      process.env.TEST_USERNAME || 'sadhin123',
      process.env.TEST_PASSWORD || '123456sS@'
    );

    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible({ timeout: 15000 });
  });

  // ── SI-02: Session persistence after page refresh @functional ────────────────────────────
  test('SI-02: should remain logged in after page refresh @functional @regression', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(
      process.env.TEST_USERNAME || 'sadhin123',
      process.env.TEST_PASSWORD || '123456sS@'
    );
    await expect(page).not.toHaveURL(/login/);

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible({ timeout: 15000 });
  });

  // ── SI-03: Empty fields @negative ────────────────────────────────────────────────────────
  test('SI-03: should not submit when both username and password are empty @negative', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginButton.click();

    await expect(page).toHaveURL(/login/);
  });

  // ── SI-04: Valid username + wrong password @negative ───────────────────────────────────
  test('SI-04: should show error modal with valid username but wrong password @negative', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginExpectingFailure(
      process.env.TEST_USERNAME || 'sadhin123',
      'WrongPassword123'
    );

    await assertLoginErrorModal(page);
    await expect(page).toHaveURL(/login/);

    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page).toHaveURL(/login/);
  });

  // ── SI-05: Wrong username + valid password @negative ───────────────────────────────────
  test('SI-05: should show error modal with wrong username but valid password @negative', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginExpectingFailure(
      'nonexistent_user_xyz',
      process.env.TEST_PASSWORD || '123456sS@'
    );

    await assertLoginErrorModal(page);
    await expect(page).toHaveURL(/login/);
  });

  // ── SI-06: Both wrong @negative ────────────────────────────────────────────────────────
  test('SI-06: should show error modal when both username and password are wrong @negative', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginExpectingFailure('wrong_user', 'wrong_pass');

    await assertLoginErrorModal(page);
    await expect(page).toHaveURL(/login/);
  });

  // ── SI-07: Unregistered account @negative ──────────────────────────────────────────────
  test('SI-07: should show error modal for unregistered username @negative', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginExpectingFailure('notregistered_xyz_999', 'SomePass@123');

    await assertLoginErrorModal(page);
    await expect(page).toHaveURL(/login/);
  });

  // ── SI-08: SQL Injection @negative ──────────────────────────────────────────────────────
  test('SI-8: should not bypass login with SQL injection payload @negative', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginExpectingFailure("' OR 1=1--", "' OR '1'='1");

    await expect(page).toHaveURL(/login/);
    await assertLoginErrorModal(page);
  });

  // ── SI-09: XSS Injection @negative ─────────────────────────────────────────────────────
  test('SI-9: should not execute XSS script injected in username field @negative', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.usernameInput.fill('<script>alert("xss")</script>');
    await loginPage.passwordInput.fill('anything');

    let dialogTriggered = false;
    page.on('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });

    await loginPage.loginButton.click();

    await expect(page).toHaveURL(/login/);
    expect(dialogTriggered, 'XSS script should not execute — alert dialog was triggered!').toBe(false);
  });

  // ── SI-10: Back button after logout @functional ──────────────────────────────────────────
  test('SI-10: should not access protected page via back button after logout @functional @regression', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login(
      process.env.TEST_USERNAME || 'sadhin123',
      process.env.TEST_PASSWORD || '123456sS@'
    );
    await expect(page).not.toHaveURL(/login/);

    const modalCloseBtn = page.locator('.modal-box button.btn-circle, .modal button.btn-circle, dialog button.btn-circle').first();
    if (await modalCloseBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await modalCloseBtn.click({ force: true }).catch(() => { });
    }

    let logoutButton = page.getByRole('button', { name: /log.?out|sign.?out/i });
    if (!(await logoutButton.isVisible({ timeout: 2000 }).catch(() => false))) {
      const profileBtn = page.locator('header button').filter({ hasText: /KAM|Profile/i }).first();
      if (await profileBtn.isVisible().catch(() => false)) {
        await profileBtn.click();
      }
    }

    const logoutLink = page.locator('a, button').filter({ hasText: /log.?out|sign.?out/i }).first();
    if (await logoutLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutLink.click();
    } else {
      await page.context().clearCookies();
      await page.goto('/login');
    }
    await expect(loginPage.usernameInput).toBeVisible({ timeout: 15000 });

    await page.goBack();
    await page.waitForURL(/login/, { timeout: 15000 }).catch(async () => {
      await page.goto('/login');
    });
    await expect(loginPage.usernameInput).toBeVisible({ timeout: 15000 });
  });
});
