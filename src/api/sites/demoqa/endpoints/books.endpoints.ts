export const BooksEndpoints = {
  /** GET (catalog), POST (add to collection), DELETE (empty collection) */
  base: '/BookStore/v1/Books',
  /** DELETE a single book from the user's collection */
  book: '/BookStore/v1/Book',
} as const;
