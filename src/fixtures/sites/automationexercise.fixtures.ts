import { test as base } from '@playwright/test';
import { HomePage } from '@pages/sites/automationexercise/HomePage';
import { ProductsPage } from '@pages/sites/automationexercise/ProductsPage';
import { ProductDetailPage } from '@pages/sites/automationexercise/ProductDetailPage';
import { SignupLoginPage } from '@pages/sites/automationexercise/SignupLoginPage';
import { CategoryPage } from '@pages/sites/automationexercise/CategoryPage';

type AutomationExerciseFixtures = {
  homePage: HomePage;
  productsPage: ProductsPage;
  productDetailPage: ProductDetailPage;
  signupLoginPage: SignupLoginPage;
  categoryPage: CategoryPage;
};

// automationexercise.com — no auth required
export const test = base.extend<AutomationExerciseFixtures>({
  homePage: async ({ page }, use) => {
    const po = new HomePage(page);
    await po.navigate();
    await use(po);
  },

  // Reached through the UI flow (home → Products), so no navigate() here
  productsPage: async ({ page }, use) => {
    await use(new ProductsPage(page));
  },

  // Reached through the UI flow (products → View Product), so no navigate() here
  productDetailPage: async ({ page }, use) => {
    await use(new ProductDetailPage(page));
  },

  // Reached through the UI flow (home → Signup / Login), so no navigate() here
  signupLoginPage: async ({ page }, use) => {
    await use(new SignupLoginPage(page));
  },

  // Sidebar is present on the home page too, so no navigate() here
  categoryPage: async ({ page }, use) => {
    await use(new CategoryPage(page));
  },
});
