import { Locator } from '@playwright/test';
import { BasePage } from '@pages/BasePage';

export class InventoryPage extends BasePage {
  get inventoryContainer(): Locator {
    return this.page.getByTestId('inventory-container');
  }

  get secondaryHeader(): Locator {
    return this.page.getByTestId('secondary-header');
  }

  get swagLabsLogo(): Locator {
    return this.page.getByText('Swag Labs');
  }
}
