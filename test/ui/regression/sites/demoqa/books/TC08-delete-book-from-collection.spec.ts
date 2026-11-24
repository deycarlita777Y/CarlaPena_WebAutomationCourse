import { test, expect } from '@fixtures';
import { bookAlerts, seededCollection, seededTitles } from '@data/sites/demoqa/books.data';

test.describe('Books', () => {
  test(
    'TC08: Delete a specific book from the user\'s collection',
    { tag: ['@mutates-data'] },
    async ({ page, bookStorePage, bookStoreLoginPage, profilePage, createdBooks, workerUser }) => {
      // createdBooks seeds the collection via API (precondition) and empties it afterwards (teardown).
      // Expected titles come from the seeded books, never from values read back from the UI.
      const [bookA, bookB] = seededTitles(createdBooks);

      await test.step('1. Open /login; the username input is visible', async () => {
        await bookStorePage.navigate('/login');
        await expect(bookStoreLoginPage.usernameInput).toBeVisible();
      });

      await test.step('2. Log in with the worker account; the URL path is /profile', async () => {
        await bookStoreLoginPage.login(workerUser.username, workerUser.password);
        await expect(page).toHaveURL(/\/profile$/);
      });

      await test.step('3. Open /profile; the books table has exactly the seeded rows', async () => {
        await profilePage.navigate('/profile');
        await expect(profilePage.bookRows).toHaveCount(seededCollection.size);
      });

      await test.step('4. Read the titles; bookA and bookB each have exactly 1 row (order not asserted)', async () => {
        await expect(profilePage.bookRowByTitle(bookA)).toHaveCount(1);
        await expect(profilePage.bookRowByTitle(bookB)).toHaveCount(1);
      });

      await test.step('5. Click the delete icon for bookA; the dialog shows OK and Cancel', async () => {
        await profilePage.openDeleteDialog(bookA);
        await expect(profilePage.deleteConfirmationDialog).toBeVisible();
        await expect(profilePage.deleteDialogOkButton).toBeVisible();
        await expect(profilePage.deleteDialogCancelButton).toBeVisible();
      });

      await test.step('6. Click OK; the alert is "Book deleted." and the dialog closes', async () => {
        const message = await profilePage.confirmDeletion();
        expect(message).toBe(bookAlerts.deleted);
        await expect(profilePage.deleteConfirmationDialog).toBeHidden();
      });

      await test.step('7. Only bookB remains: bookA rows = 0, total rows = 1, remaining row = bookB', async () => {
        await expect(profilePage.bookRowByTitle(bookA)).toHaveCount(0);
        await expect(profilePage.bookRows).toHaveCount(seededCollection.size - 1);
        await expect(profilePage.bookTitleLinks).toHaveText([bookB]);
      });
    },
  );
});
