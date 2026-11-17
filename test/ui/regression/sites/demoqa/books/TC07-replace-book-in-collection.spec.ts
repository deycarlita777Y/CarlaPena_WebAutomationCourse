import { test, expect } from '@fixtures';
import { bookStoreUsers } from '@data/sites/demoqa/auth.data';
import { bookAlerts, singleBookCollection } from '@data/sites/demoqa/books.data';

test.describe('Books', () => {
  test(
    'TC07: Replace a book in the user\'s collection',
    async ({ bookStorePage, bookStoreLoginPage, bookDetailPage, profilePage, createdBook }) => {
      // createdBook seeds exactly one book (Book A) via API (precondition) and empties the collection afterwards.
      const bookA = createdBook.title;
      let bookB = '';

      await test.step('Log in and navigate to the profile page', async () => {
        await bookStorePage.navigate('/login');
        await expect(bookStoreLoginPage.usernameInput).toBeVisible();
        await bookStoreLoginPage.login(bookStoreUsers.appUser.username, bookStoreUsers.appUser.password);
        await profilePage.navigate('/profile');
        await expect(profilePage.usernameValue).toHaveText(bookStoreUsers.appUser.username);
      });

      await test.step('Assert the books table shows exactly one row: Book A', async () => {
        await expect(profilePage.bookRows).toHaveCount(singleBookCollection.size);
        await expect(profilePage.bookRowByTitle(bookA)).toBeVisible();
      });

      await test.step('Click the delete icon for Book A and assert the confirmation dialog', async () => {
        await profilePage.deleteIconForBook(bookA).click();
        await expect(profilePage.deleteConfirmationDialog).toBeVisible();
        await expect(profilePage.deleteDialogOkButton).toBeVisible();
      });

      await test.step('Click OK and assert the dialog closes', async () => {
        const message = await profilePage.confirmDeletion();
        expect(message).toBe(bookAlerts.deleted);
        await expect(profilePage.deleteConfirmationDialog).toBeHidden();
      });

      await test.step('Assert Book A is gone and the table has zero rows', async () => {
        await expect(profilePage.bookRowByTitle(bookA)).toHaveCount(0);
        await expect(profilePage.bookRows).toHaveCount(0);
      });

      await test.step('Navigate to the catalog and open a different book (Book B)', async () => {
        await bookStorePage.navigate('/books');
        await expect(bookStorePage.bookList.first()).toBeVisible();
        const titles = await bookStorePage.getBookTitles();
        bookB = titles.find((title) => title !== bookA) ?? '';
        expect(bookB).not.toBe('');
        await bookStorePage.clickBookByTitle(bookB);
      });

      await test.step('Assert the detail page for Book B is displayed', async () => {
        await expect(bookDetailPage.bookInfoBlock).toBeVisible();
        await expect(bookDetailPage.titleValue).toHaveText(bookB);
      });

      await test.step('Click "Add To Your Collection" and confirm the alert', async () => {
        const message = await bookDetailPage.addToCollection();
        expect(message).toBe(bookAlerts.added);
      });

      await test.step('Navigate to profile and assert Book B replaced Book A (net-zero change)', async () => {
        await profilePage.navigate('/profile');
        await expect(profilePage.bookRowByTitle(bookB)).toBeVisible();
        await expect(profilePage.bookRowByTitle(bookA)).toHaveCount(0);
        await expect(profilePage.bookRows).toHaveCount(singleBookCollection.size);
      });
    },
  );
});
