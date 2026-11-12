import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://www.automationexercise.com/');
  await page.getByRole('link', { name: ' Home' }).click();
  await expect(page.locator('#slider')).toBeVisible();
  await page.getByRole('link', { name: ' Products' }).click();
  await page.locator('iframe[name="aswift_3"]').contentFrame().getByRole('button', { name: 'Close ad' }).click();
  await expect(page.locator('section').filter({ hasText: 'Category Women Dress Tops' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search Product' }).click();
  await page.getByRole('textbox', { name: 'Search Product' }).fill('Summer White Top');
  await page.locator('#submit_search').click();
  await expect(page.getByText('Searched Products  Added!')).toBeVisible();
  await page.getByRole('heading', { name: 'Rs.' }).nth(1).click();
  await page.getByText('Summer White Top').nth(1).click();
  await expect(page.locator('div').filter({ hasText: 'Category Women Dress Tops' }).nth(1)).toBeVisible();
  await expect(page.getByText('Summer White Top').nth(1)).toBeVisible();
});