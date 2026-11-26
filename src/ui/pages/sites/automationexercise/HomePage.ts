import { Locator } from '@playwright/test';
import { BasePage } from '@pages/BasePage';

export class HomePage extends BasePage {
  get featuresItemsHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Features Items' });
  }

  get slider(): Locator {
    // locator: carousel is a <section> without accessible name
    return this.page.locator('#slider');
  }

  get productsLink(): Locator {
    return this.page.getByRole('banner').getByRole('link', { name: 'Products' });
  }

  get homeLink(): Locator {
    return this.page.getByRole('link', { name: 'Home' });
  }

  get signupLoginLink(): Locator {
    return this.page.getByRole('link', { name: 'Signup / Login' });
  }

  async openProducts(): Promise<void> {
    await this.productsLink.click();
  }

  async openSignupLogin(): Promise<void> {
    await this.signupLoginLink.click();
  }
}
