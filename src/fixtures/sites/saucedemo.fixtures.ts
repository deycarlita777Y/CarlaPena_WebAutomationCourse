import { test as base } from '@playwright/test';
import { LoginPage } from '@pages/sites/saucedemo/LoginPage';
import { InventoryPage } from '@pages/sites/saucedemo/InventoryPage';
import { users } from '@data/sites/saucedemo/auth.data';

type SaucedemoFixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  authenticatedPage: LoginPage;
};

export const test = base.extend<SaucedemoFixtures>({
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
});
