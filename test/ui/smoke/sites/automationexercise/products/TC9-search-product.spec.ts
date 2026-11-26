import { test, expect } from '@fixtures';
import { Env } from '@config/Env';
import { searchTerms } from '@data/sites/automationexercise/products.data';

test.use({ baseURL: Env.automationExerciseUrl });

test.describe('Products', () => {
  test('TC9: Search product lists only the products matching the search term', async ({
    homePage,
    productsPage,
  }) => {
    await test.step('Verify the home page is visible', async () => {
      await expect(homePage.slider).toBeVisible();
    });

    await test.step('Open the Products page', async () => {
      await homePage.openProducts();
      await expect(productsPage.allProductsHeading).toBeVisible();
    });

    await test.step('Search for a product by name', async () => {
      await productsPage.searchProduct(searchTerms.summerWhiteTop);
      await expect(productsPage.searchedProductsHeading).toBeVisible();
    });

    await test.step('Verify all the listed products match the search', async () => {
      await expect(productsPage.productNames).not.toHaveCount(0);
      const names = await productsPage.productNames.allTextContents();
      expect(names.length).toBeGreaterThan(0);
      for (const name of names) {
        expect(name.toLowerCase()).toContain(searchTerms.summerWhiteTop);
      }
    });
  });
});
