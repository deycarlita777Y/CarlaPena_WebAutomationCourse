import { test, expect } from '@fixtures';
import { Env } from '@config/Env';
import { categories } from '@data/categories.data';

test.use({ baseURL: Env.automationExerciseUrl });

test.describe('Products', () => {
  test('TC18: View category products for Women and Men sub-categories', async ({
    homePage,
    categoryPage,
  }) => {
    await test.step('Verify the home page and the categories sidebar are visible', async () => {
      await expect(homePage.slider).toBeVisible();
      await expect(categoryPage.categoriesHeading).toBeVisible();
      await expect(categoryPage.womenCategoryLink).toBeVisible();
      await expect(categoryPage.menCategoryLink).toBeVisible();
    });

    await test.step('Open a sub-category under Women', async () => {
      await categoryPage.openWomenSubCategory(categories.women.subCategory);
    });

    await test.step('Verify the Women category page is displayed', async () => {
      await expect(categoryPage.categoryTitle).toHaveText(categories.women.title, {
        ignoreCase: true,
      });
    });

    await test.step('Open a sub-category under Men', async () => {
      await categoryPage.openMenSubCategory(categories.men.subCategory);
    });

    await test.step('Verify the Men category page is displayed', async () => {
      await expect(categoryPage.categoryTitle).toHaveText(categories.men.title, {
        ignoreCase: true,
      });
    });
  });
});
