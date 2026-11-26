import { Locator } from '@playwright/test';
import { BasePage } from '@pages/BasePage';

export class BookStorePage extends BasePage {
  /** "Book Store" entry of the left sidebar menu. demoqa /books has no heading element (verified in the DOM). */
  get bookStoreMenuItem(): Locator {
    return this.page.getByText('Book Store', { exact: true });
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder('Type to search');
  }

  get loginLink(): Locator {
    return this.page.getByRole('button', { name: 'Login' });
  }

  /** Catalog rows that contain a book link (header and empty filler rows are excluded). */
  get bookList(): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByRole('link') });
  }

  private get firstBookLink(): Locator {
    // position: first row of the catalog table is the TC intent (open the first book)
    return this.bookList.first().getByRole('link');
  }

  async getFirstBookTitle(): Promise<string> {
    return (await this.firstBookLink.innerText()).trim();
  }

  async clickFirstBook(): Promise<void> {
    await this.firstBookLink.click();
  }

  /** Catalog link of the book with the given title. */
  bookLinkByTitle(title: string): Locator {
    return this.bookList.getByRole('link', { name: title, exact: true });
  }

  /** Opens the detail page of the book with the given title. */
  async clickBookByTitle(title: string): Promise<void> {
    await this.bookLinkByTitle(title).click();
  }

  async searchFor(term: string): Promise<void> {
    await this.searchInput.fill(term);
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
  }
}
