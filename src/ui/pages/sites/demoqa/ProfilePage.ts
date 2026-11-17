import { Locator } from '@playwright/test';
import { BasePage } from '@pages/BasePage';

export class ProfilePage extends BasePage {
  get usernameValue(): Locator {
    return this.page.locator('#userName-value');
  }

  get bookRows(): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByRole('link') });
  }

  /** Confirmation modal shown after clicking a delete icon ("Delete Book"). */
  get deleteConfirmationDialog(): Locator {
    return this.page.locator('.modal-content');
  }

  get deleteDialogOkButton(): Locator {
    return this.deleteConfirmationDialog.getByRole('button', { name: 'OK' });
  }

  get deleteDialogCancelButton(): Locator {
    return this.deleteConfirmationDialog.getByRole('button', { name: 'Cancel' });
  }

  bookRowByTitle(title: string): Locator {
    return this.bookRows.filter({ hasText: title });
  }

  /** Delete icon of the Action column for the given book. */
  deleteIconForBook(title: string): Locator {
    return this.bookRowByTitle(title).getByTitle('Delete');
  }

  /** Titles of every book currently listed, in table order. */
  async getBookTitles(): Promise<string[]> {
    return this.bookRows.getByRole('link').allInnerTexts();
  }

  /** Clicks OK in the confirmation modal, accepts the follow-up browser alert and returns its message. */
  async confirmDeletion(): Promise<string> {
    const dialogPromise = this.page.waitForEvent('dialog');
    await this.deleteDialogOkButton.click();
    const dialog = await dialogPromise;
    const message = dialog.message();
    await dialog.accept();
    return message;
  }
}
