/** Search term used by the Book Store search TC. Matches only "Git Pocket Guide" in the catalog. */
export const bookSearch = {
  term: 'Git',
} as const;

/** Browser alert messages shown by the Book Store profile and detail pages. */
export const bookAlerts = {
  added: 'Book added to your collection.',
  deleted: 'Book deleted.',
} as const;

/** Collection seeded through the API for TCs that start with exactly one book (e.g. TC07 replace a book). */
export const singleBookCollection = {
  size: 1,
} as const;

/** Collection seeded through the API for TCs that need an existing collection (e.g. TC08 delete one book). */
export const seededCollection = {
  size: 2,
  deleteSuccessMessage: 'Book deleted.',
} as const;

/** Titles of the two seeded books (TC08). Throws when the seed is not exactly `seededCollection.size` books. */
export function seededTitles(books: readonly { title: string }[]): [string, string] {
  const [first, second] = books.map((book) => book.title);
  if (books.length !== seededCollection.size || !first || !second) {
    throw new Error(`Expected ${seededCollection.size} seeded books, got ${books.length}`);
  }
  return [first, second];
}

/** Title of the first catalog book that is not `excludedTitle` (TC07 Book B). Throws when none exists. */
export function otherBookTitle(catalog: readonly { title: string }[], excludedTitle: string): string {
  const other = catalog.find((book) => book.title !== excludedTitle);
  if (!other) throw new Error(`The catalog has no book other than "${excludedTitle}"`);
  return other.title;
}
