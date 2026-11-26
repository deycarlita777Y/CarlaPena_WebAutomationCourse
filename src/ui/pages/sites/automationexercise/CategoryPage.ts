import { Locator } from '@playwright/test';
import { BasePage } from '@pages/BasePage';

export class CategoryPage extends BasePage {
  get categorySidebar(): Locator {
    // locator: sidebar is a plain div with no landmark role or accessible name
    return this.page.locator('.left-sidebar');
  }

  get categoriesHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Category' });
  }

  get womenCategoryHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Women' });
  }

  // accessible names carry a leading icon glyph (" Women"), so they are matched by suffix instead of exact
  get womenCategoryLink(): Locator {
    return this.categorySidebar.getByRole('link', { name: /Women$/ });
  }

  get menCategoryLink(): Locator {
    return this.categorySidebar.getByRole('link', { name: /\bMen$/ });
  }

  get categoryTitle(): Locator {
    // locator: title is an h2 inside the product list with no unique accessible name
    return this.page.locator('.features_items .title');
  }

  subCategoryLink(name: string): Locator {
    return this.categorySidebar.getByRole('link', { name, exact: true });
  }

  async openWomenSubCategory(name: string): Promise<void> {
    await this.womenCategoryLink.click();
    await this.subCategoryLink(name).click();
  }

  async openMenSubCategory(name: string): Promise<void> {
    await this.menCategoryLink.click();
    await this.subCategoryLink(name).click();
  }
}
