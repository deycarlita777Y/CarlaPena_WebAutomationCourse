import { Locator } from '@playwright/test';
import { BasePage } from '@pages/BasePage';

export class ProductDetailPage extends BasePage {
  private get information(): Locator {
    return this.page.locator('.product-information');
  }

  get name(): Locator {
    return this.information.getByRole('heading');
  }

  get category(): Locator {
    return this.information.getByText('Category:');
  }

  get price(): Locator {
    return this.information.getByText(/Rs\.\s*\d+/);
  }

  get availability(): Locator {
    return this.information.getByText('Availability:');
  }

  get condition(): Locator {
    return this.information.getByText('Condition:');
  }

  get brand(): Locator {
    return this.information.getByText('Brand:');
  }
}
