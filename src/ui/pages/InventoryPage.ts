import { Locator } from '@playwright/test';
import { BasePage } from '@pages/BasePage';

export class InventoryPage extends BasePage {
  get inventoryContainer(): Locator {
    return this.page.locator('[data-test="inventory-container"]');
  }

  get secondaryHeader(): Locator {
    return this.page.locator('[data-test="secondary-header"]');
  }

  get swagLabsLogo(): Locator {
    return this.page.locator('.app_logo');
  }
}
