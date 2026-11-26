import { Locator } from '@playwright/test';
import { BasePage } from '@pages/BasePage';

export class ProductsPage extends BasePage {
  get allProductsHeading(): Locator {
    return this.page.getByRole('heading', { name: 'All Products' });
  }

  get productCards(): Locator {
    // locator: product card is a plain div (no role); scoped to the product list
    return this.page.locator('.features_items .product-image-wrapper');
  }

  get searchInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Search Product' });
  }

  get searchButton(): Locator {
    // locator: icon-only button, no accessible name; unique id
    return this.page.locator('#submit_search');
  }

  get searchedProductsHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Searched Products' });
  }

  get productNames(): Locator {
    // locator: product name is a bare <p> inside the card, no role
    return this.page.locator('.features_items .productinfo p');
  }

  get firstViewProductLink(): Locator {
    // position: opening the first product of the catalog is the TC intent
    return this.page.getByRole('link', { name: 'View Product' }).first();
  }

  async searchProduct(name: string): Promise<void> {
    await this.searchInput.fill(name);
    await this.searchButton.click();
  }

  async openFirstProduct(): Promise<void> {
    await this.firstViewProductLink.click();
  }
}
