import { Locator } from '@playwright/test';
import { BasePage } from '@pages/BasePage';

export class CategoryPage extends BasePage {
  get categorySidebar(): Locator {
    return this.page.locator('.left-sidebar');
  }

  get categoriesHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Category' });
  }

  get womenCategoryHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Women' });
  }

  get womenCategoryLink(): Locator {
    return this.categorySidebar.locator('a[href="#Women"]');
  }

  get menCategoryLink(): Locator {
    return this.categorySidebar.locator('a[href="#Men"]');
  }

  get categoryTitle(): Locator {
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
