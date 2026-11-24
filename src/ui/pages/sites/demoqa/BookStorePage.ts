import { Locator } from '@playwright/test';
import { BasePage } from '@pages/BasePage';

export class BookStorePage extends BasePage {
  get pageHeading(): Locator {
    return this.page.getByText('Book Store', { exact: true }).first();
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
    // First row of the catalog table — position is meaningful here
    return this.bookList.first().getByRole('link');
  }

  async getFirstBookTitle(): Promise<string> {
    return (await this.firstBookLink.innerText()).trim();
  }

  async clickFirstBook(): Promise<void> {
    await this.firstBookLink.click();
  }

  /** Titles of every book currently listed in the catalog, in table order. */
  async getBookTitles(): Promise<string[]> {
    return (await this.bookList.getByRole('link').allInnerTexts()).map((title) => title.trim());
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
