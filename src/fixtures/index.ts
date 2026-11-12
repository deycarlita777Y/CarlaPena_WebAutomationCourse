import { test as base, expect } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { InventoryPage } from '@pages/InventoryPage';
import { HomePage } from '@pages/HomePage';
import { ProductsPage } from '@pages/ProductsPage';
import { ProductDetailPage } from '@pages/ProductDetailPage';
import { SignupLoginPage } from '@pages/SignupLoginPage';
import { CategoryPage } from '@pages/CategoryPage';
import { users } from '@data/auth.data';

// Re-export expect so all spec files import from '@fixtures' only
export { expect };

type Fixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  authenticatedPage: LoginPage;
  homePage: HomePage;
  productsPage: ProductsPage;
  productDetailPage: ProductDetailPage;
  signupLoginPage: SignupLoginPage;
  categoryPage: CategoryPage;
};

export const test = base.extend<Fixtures>({
  // Unauthenticated — navigates to the login page, then hands off
  loginPage: async ({ page }, use) => {
    const po = new LoginPage(page);
    await po.navigate();
    await use(po);
  },

  authenticatedPage: async ({ page }, use) => {
    const lp = new LoginPage(page);
    await lp.navigate();
    await lp.login(users.appUser.username, users.appUser.password);
    await use(lp);
  },
   
  inventoryPage: async ({ authenticatedPage }, use) => {
    const po = new InventoryPage(authenticatedPage.currentPage);
    await use(po);
  },

  // automationexercise.com — no auth required
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
