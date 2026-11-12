import { Locator } from '@playwright/test';
import { BasePage } from '@pages/BasePage';

export class ProductsPage extends BasePage {
  get allProductsHeading(): Locator {
    return this.page.getByRole('heading', { name: 'All Products' });
  }

  get productCards(): Locator {
    return this.page.locator('.features_items .product-image-wrapper');
  }

  get searchInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Search Product' });
  }

  get searchButton(): Locator {
    return this.page.locator('#submit_search');
  }

  get searchedProductsHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Searched Products' });
  }

  get productNames(): Locator {
    return this.page.locator('.features_items .productinfo p');
  }

  get firstViewProductLink(): Locator {
    return this.page.locator('a[href^="/product_details/"]').first();
  }

  async searchProduct(name: string): Promise<void> {
    await this.searchInput.fill(name);
    await this.searchButton.click();
  }

  async openFirstProduct(): Promise<void> {
    await this.firstViewProductLink.click();
  }
}
