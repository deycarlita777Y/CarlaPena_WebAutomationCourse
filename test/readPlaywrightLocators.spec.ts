import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://qaplayground.com/');
  await page.waitForLoadState('domcontentloaded');
  await page.getByRole('link', { name: 'Blogs' }).click();
  await page.getByTestId('blog-filter-playwright').click();
  await page.getByTestId('blog-link-getting-started-with-playwright-locators').click();
  await expect(page.getByTestId('blog-post-getting-started-with-playwright-locators')).toBeVisible();
  await expect(page.getByTestId('blog-post-title')).toContainText('Getting Started with Playwright Locators');
});