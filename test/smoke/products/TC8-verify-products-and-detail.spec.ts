import { test, expect } from '@fixtures';
import { Env } from '@config/Env';

test.use({ baseURL: Env.automationExerciseUrl });

test.describe('Products', () => {
  test('TC8: Verify All Products and product detail page', async ({
    homePage,
    productsPage,
    productDetailPage,
  }) => {
    await test.step('Verify the home page is visible', async () => {
      await expect(homePage.slider).toBeVisible();
    });

    await test.step('Open the Products page and verify the products list', async () => {
      await homePage.openProducts();
      await expect(productsPage.allProductsHeading).toBeVisible();
      await expect(productsPage.productCards.first()).toBeVisible();
    });

    await test.step('Open the first product detail page', async () => {
      await productsPage.openFirstProduct();
      await expect(productDetailPage.name).toBeVisible();
    });

    await test.step('Verify the product detail fields are visible', async () => {
      await expect(productDetailPage.category).toBeVisible();
      await expect(productDetailPage.price).toBeVisible();
      await expect(productDetailPage.availability).toBeVisible();
      await expect(productDetailPage.condition).toBeVisible();
      await expect(productDetailPage.brand).toBeVisible();
    });
  });
});
