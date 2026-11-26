import { test, expect } from '@fixtures';
import { bookAlerts, otherBookTitle, singleBookCollection } from '@data/sites/demoqa/books.data';

test.describe('Books', () => {
  test(
    'TC07: Replace a book in the user\'s collection',
    { tag: ['@mutates-data'] },
    async ({ page, bookStorePage, bookStoreLoginPage, bookDetailPage, profilePage, createdBook, bookController, workerUser }) => {
      // createdBook seeds exactly one book (Book A) via API (precondition) and empties the collection afterwards.
      // Book B is the first catalog entry that is not Book A, discovered through the API (not read from the UI).
      const bookA = createdBook.title;
      const bookB = otherBookTitle(await bookController.getAll(), bookA);

      await test.step('1. Open /login; the username input is visible', async () => {
        await bookStorePage.navigate('/login');
        await expect(bookStoreLoginPage.usernameInput).toBeVisible();
      });

      await test.step('2. Log in with the worker account; the URL path is /profile', async () => {
        await bookStoreLoginPage.login(workerUser.username, workerUser.password);
        await expect(page).toHaveURL(/\/profile$/);
      });

      await test.step('3. Open /profile; the username value is the worker account', async () => {
        await profilePage.navigate('/profile');
        await expect(profilePage.usernameValue).toHaveText(workerUser.username);
      });

      await test.step('4. Read the books table; exactly 1 row with title = bookA', async () => {
        await expect(profilePage.bookRows).toHaveCount(singleBookCollection.size);
        await expect(profilePage.bookRowByTitle(bookA)).toBeVisible();
      });

      await test.step('5. Click the delete icon for bookA; the dialog shows OK', async () => {
        await profilePage.openDeleteDialog(bookA);
        await expect(profilePage.deleteConfirmationDialog).toBeVisible();
        await expect(profilePage.deleteDialogOkButton).toBeVisible();
      });

      await test.step('6. Click OK; the alert is "Book deleted." and the dialog closes', async () => {
        const message = await profilePage.confirmDeletion();
        expect(message).toBe(bookAlerts.deleted);
        await expect(profilePage.deleteConfirmationDialog).toBeHidden();
      });

      await test.step('7. Read the books table; bookA rows = 0, total rows = 0', async () => {
        await expect(profilePage.bookRowByTitle(bookA)).toHaveCount(0);
        await expect(profilePage.bookRows).toHaveCount(0);
      });

      await test.step('8. Open /books; the catalog lists bookB', async () => {
        await bookStorePage.navigate('/books');
        await expect(bookStorePage.bookLinkByTitle(bookB)).toBeVisible();
      });

      await test.step('9. Click the title bookB; the detail Title = bookB', async () => {
        await bookStorePage.clickBookByTitle(bookB);
        await expect(bookDetailPage.bookInfoBlock).toBeVisible();
        await expect(bookDetailPage.titleValue).toHaveText(bookB);
      });

      await test.step('10. Click "Add To Your Collection"; the alert is "Book added to your collection."', async () => {
        const message = await bookDetailPage.addToCollection();
        expect(message).toBe(bookAlerts.added);
      });

      await test.step('11. Open /profile; bookB row present, bookA rows = 0, total rows = 1', async () => {
        await profilePage.navigate('/profile');
        await expect(profilePage.bookRowByTitle(bookB)).toBeVisible();
        await expect(profilePage.bookRowByTitle(bookA)).toHaveCount(0);
        await expect(profilePage.bookRows).toHaveCount(singleBookCollection.size);
      });
    },
  );
});
