import { test, expect } from '@fixtures';
import { bookStoreUsers } from '@data/sites/demoqa/auth.data';
import { seededCollection } from '@data/sites/demoqa/books.data';

test.describe('Books', () => {
  test(
    'TC08: Delete a specific book from the user\'s collection',
    async ({ bookStorePage, bookStoreLoginPage, profilePage, createdBooks }) => {
      // createdBooks seeds the collection via API (precondition) and empties it afterwards (teardown).
      let bookA = '';
      let totalRows = 0;
      let remainingTitles: string[] = [];

      await test.step('Log in and navigate to the profile page', async () => {
        await bookStorePage.navigate('/login');
        await bookStoreLoginPage.login(bookStoreUsers.appUser.username, bookStoreUsers.appUser.password);
        await profilePage.navigate('/profile');
      });

      await test.step('Assert the books table contains at least two book rows', async () => {
        await expect(profilePage.bookRows).toHaveCount(createdBooks.length);
        expect(createdBooks.length).toBeGreaterThanOrEqual(seededCollection.size);
      });

      await test.step('Note the first book as Book A and count the total rows as N', async () => {
        const titles = await profilePage.getBookTitles();
        bookA = titles[0] ?? '';
        totalRows = titles.length;
        remainingTitles = titles.slice(1);
        expect(bookA).not.toBe('');
      });

      await test.step('Click the delete icon for Book A', async () => {
        await profilePage.deleteIconForBook(bookA).click();
      });

      await test.step('Assert a confirmation dialog appears with OK and Cancel buttons', async () => {
        await expect(profilePage.deleteConfirmationDialog).toBeVisible();
        await expect(profilePage.deleteDialogOkButton).toBeVisible();
        await expect(profilePage.deleteDialogCancelButton).toBeVisible();
      });

      await test.step('Click OK and assert the dialog closes', async () => {
        const message = await profilePage.confirmDeletion();
        expect(message).toBe(seededCollection.deleteSuccessMessage);
        await expect(profilePage.deleteConfirmationDialog).toBeHidden();
      });

      await test.step('Assert Book A is gone and the table has N - 1 rows', async () => {
        await expect(profilePage.bookRowByTitle(bookA)).toHaveCount(0);
        await expect(profilePage.bookRows).toHaveCount(totalRows - 1);
      });

      await test.step('Assert the remaining books are still present and unchanged', async () => {
        for (const title of remainingTitles) {
          await expect(profilePage.bookRowByTitle(title)).toBeVisible();
        }
      });
    },
  );
});
