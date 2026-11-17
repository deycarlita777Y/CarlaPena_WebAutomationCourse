import { test, expect } from '@fixtures';
import { users, loginMessages } from '@data/sites/saucedemo/auth.data';

test.describe('Login', () => {
  test('TC0: shows an error when logging in with invalid credentials', async ({ loginPage }) => {
    await loginPage.login(users.invalidUser.username, users.invalidUser.password);

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText(loginMessages.invalidCredentials);
  });
});
