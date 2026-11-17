import { ApiClient } from '@api/client/ApiClient';
import { BooksEndpoints } from '@api/sites/demoqa/endpoints/books.endpoints';
import { AddBooksPayload, Book, BooksResponse, DeleteBookPayload } from '@api/sites/demoqa/models/book.model';

export class BookController {
  constructor(private readonly client: ApiClient) {}

  /** Returns the full catalog of books. */
  async getAll(): Promise<Book[]> {
    const response = await this.client.get<BooksResponse>(BooksEndpoints.base);
    return response.books;
  }

  /** Adds books (by ISBN) to the user's collection. Requires an authenticated client. */
  async addToCollection(userId: string, isbns: string[]): Promise<void> {
    const payload: AddBooksPayload = { userId, collectionOfIsbns: isbns.map((isbn) => ({ isbn })) };
    await this.client.post<unknown>(BooksEndpoints.base, payload);
  }

  /** Removes one book from the user's collection. Requires an authenticated client. */
  deleteOne(userId: string, isbn: string): Promise<void> {
    const payload: DeleteBookPayload = { isbn, userId };
    return this.client.delete(BooksEndpoints.book, { data: payload });
  }

  /** Deletes every book in the user's collection (idempotent). Requires an authenticated client. */
  deleteAll(userId: string): Promise<void> {
    return this.client.delete(BooksEndpoints.base, { params: { UserId: userId } });
  }
}
