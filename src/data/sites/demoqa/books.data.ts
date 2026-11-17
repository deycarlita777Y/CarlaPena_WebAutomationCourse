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
