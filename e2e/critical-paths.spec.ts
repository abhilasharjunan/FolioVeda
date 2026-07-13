import { test, expect } from '@playwright/test';

test.describe('Critical User Paths', () => {

  test('homepage loads with navigation links', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
  });

  test('fund detail page redirects unauthenticated users to sign in', async ({ page }) => {
    await page.goto('/funds/118531');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*auth\/signin.*/);
  });

  test('risk analysis page redirects unauthenticated users to sign in', async ({ page }) => {
    await page.goto('/risk-analysis');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*auth\/signin.*/);
  });

  test('top funds page redirects unauthenticated users to sign in', async ({ page }) => {
    await page.goto('/top-funds');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*auth\/signin.*/);
  });

  test('fund comparison page redirects unauthenticated users to sign in', async ({ page }) => {
    await page.goto('/funds/compare');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*auth\/signin.*/);
  });

  test('sign in page displays form', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign in")')).toBeVisible();
  });

  test('portfolio page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*auth\/signin.*/);
  });

});
