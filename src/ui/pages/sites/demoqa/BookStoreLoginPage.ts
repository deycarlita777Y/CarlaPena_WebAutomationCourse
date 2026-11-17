import { Locator } from '@playwright/test';
import { BasePage } from '@pages/BasePage';

export class BookStoreLoginPage extends BasePage {
  get usernameInput(): Locator {
    return this.page.getByPlaceholder('UserName');
  }

  get passwordInput(): Locator {
    return this.page.getByPlaceholder('Password');
  }

  get loginButton(): Locator {
    return this.page.getByRole('button', { name: 'Login' });
  }

  /** Submits the credentials and waits for demoqa's redirect to /profile, i.e. until the session is established. */
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForURL('**/profile');
  }
}
