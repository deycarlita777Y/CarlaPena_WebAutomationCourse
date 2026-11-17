import { test as base, APIRequestContext } from '@playwright/test';
import { BookStorePage } from '@pages/sites/demoqa/BookStorePage';
import { BookStoreLoginPage } from '@pages/sites/demoqa/BookStoreLoginPage';
import { BookDetailPage } from '@pages/sites/demoqa/BookDetailPage';
import { ProfilePage } from '@pages/sites/demoqa/ProfilePage';
import { ApiClient } from '@api/client/ApiClient';
import { AccountController } from '@api/sites/demoqa/controllers/AccountController';
import { BookController } from '@api/sites/demoqa/controllers/BookController';
import { Book } from '@api/sites/demoqa/models/book.model';
import { Env } from '@config/Env';
import { demoqaUser } from '@data/sites/demoqa/auth.data';
import { seededCollection, singleBookCollection } from '@data/sites/demoqa/books.data';

type DemoqaFixtures = {
  bookStorePage: BookStorePage;
  bookStoreLoginPage: BookStoreLoginPage;
  bookDetailPage: BookDetailPage;
  profilePage: ProfilePage;
  cleanBookshelf: void;
  createdBooks: Book[];
  createdBook: Book;
};

export const test = base.extend<DemoqaFixtures>({
  // demoqa.com Book Store — no auth required; navigates to the catalog
  bookStorePage: async ({ page }, use) => {
    const po = new BookStorePage(page);
    await po.navigate('/books');
    await use(po);
  },

  // Reached through the UI flow (catalog → Login), so no navigate() here
  bookStoreLoginPage: async ({ page }, use) => {
    await use(new BookStoreLoginPage(page));
  },

  // Reached through the UI flow (catalog → book title), so no navigate() here
  bookDetailPage: async ({ page }, use) => {
    await use(new BookDetailPage(page));
  },

  // Reached through the UI flow / explicit navigate('/profile') in the spec
  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },

  // Postcondition guarantee: empties the user's collection via API before AND after the test
  cleanBookshelf: async ({ request }, use) => {
    const client = new ApiClient(request, Env.demoqaUrl);
    const account = new AccountController(client);
    const books = new BookController(client);

    // Re-authenticates on every call (R9): the UI login during the test invalidates the setup token.
    // Retries and verifies the collection is really empty — a 204 alone does not guarantee it.
    const emptyCollection = async (): Promise<void> => {
      const attempts = 3;
      let remaining = -1;
      for (let attempt = 1; attempt <= attempts; attempt++) {
        const userId = await account.authenticate(demoqaUser.username, demoqaUser.password);
        await books.deleteAll(userId);
        remaining = ((await account.getUser(userId)).books ?? []).length;
        if (remaining === 0) return;
      }
      throw new Error(`cleanBookshelf could not empty the collection after 3 attempts (books left: ${remaining})`);
    };

    await emptyCollection();
    await use();
    await emptyCollection();
  },

  // Precondition: user's collection holds exactly `seededCollection.size` books (added via API).
  // Depends on cleanBookshelf, so the collection is verified empty before seeding.
  createdBooks: async ({ request, cleanBookshelf }, use) => {
    void cleanBookshelf;
    const seed = await seedCollection(request, seededCollection.size);
    await use(seed.books);
    await seed.teardown();
  },

  // Precondition: user's collection holds exactly ONE book (added via API) — e.g. TC07 replace a book.
  // Depends on cleanBookshelf, so the collection is verified empty before seeding.
  createdBook: async ({ request, cleanBookshelf }, use) => {
    void cleanBookshelf;
    const seed = await seedCollection(request, singleBookCollection.size);
    const [book] = seed.books;
    if (!book) throw new Error('createdBook could not seed a book');
    await use(book);
    await seed.teardown();
  },
});

/**
 * Seeds the first `count` catalog books into the user's collection through the API.
 * `teardown` (R4/R9) refreshes the token — the UI login invalidates the setup token — and empties the
 * collection; deleteAll is idempotent, so it is safe even if the test already removed a book.
 */
async function seedCollection(
  request: APIRequestContext,
  count: number,
): Promise<{ books: Book[]; teardown: () => Promise<void> }> {
  const client = new ApiClient(request, Env.demoqaUrl);
  const account = new AccountController(client);
  const controller = new BookController(client);

  const userId = await account.authenticate(demoqaUser.username, demoqaUser.password);
  const books = (await controller.getAll()).slice(0, count);
  if (books.length < count) {
    throw new Error(`Seeding needs ${count} catalog books, found ${books.length}`);
  }
  await controller.addToCollection(userId, books.map((book) => book.isbn));

  return {
    books,
    teardown: async () => {
      const teardownUserId = await account.authenticate(demoqaUser.username, demoqaUser.password);
      await controller.deleteAll(teardownUserId);
    },
  };
}
