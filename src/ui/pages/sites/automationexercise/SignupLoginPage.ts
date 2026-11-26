import { Locator } from '@playwright/test';
import { BasePage } from '@pages/BasePage';

export class SignupLoginPage extends BasePage {
  get loginHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Login to your account' });
  }

  get emailInput(): Locator {
    return this.page
      // locator: the login form has no accessible name, so no form role; filtered by its text
      .locator('form')
      .filter({ hasText: 'Login' })
      .getByPlaceholder('Email Address');
  }

  get passwordInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Password' });
  }

  get loginButton(): Locator {
    return this.page.getByRole('button', { name: 'Login' });
  }

  get errorMessage(): Locator {
    return this.page.getByText('Your email or password is incorrect!');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
