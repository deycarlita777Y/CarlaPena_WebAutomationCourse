import { Locator } from '@playwright/test';
import { BasePage } from '@pages/BasePage';

export class BookDetailPage extends BasePage {
  get titleValue(): Locator {
    // locator: value is a <label> with no accessible name. The id repeats across the page (9 matches on the
    // detail view, verified in the DOM), so it is only unique inside #title-wrapper (bookInfoBlock).
    return this.bookInfoBlock.locator('#userName-value');
  }

  /** Block holding the book's Title field and value. */
  get bookInfoBlock(): Locator {
    // locator: block is a plain div with no role or accessible name
    return this.page.locator('#title-wrapper');
  }

  get backToBookStoreButton(): Locator {
    return this.page.getByRole('button', { name: 'Back To Book Store' });
  }

  get addToCollectionButton(): Locator {
    return this.page.getByRole('button', { name: 'Add To Your Collection' });
  }

  /** Clicks "Add To Your Collection", accepts the browser alert and returns its message. */
  async addToCollection(): Promise<string> {
    const dialogPromise = this.page.waitForEvent('dialog');
    await this.addToCollectionButton.click();
    const dialog = await dialogPromise;
    const message = dialog.message();
    await dialog.accept();
    return message;
  }
}
