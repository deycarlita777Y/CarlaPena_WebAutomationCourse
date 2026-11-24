import { Book } from '@api/sites/demoqa/models/book.model';

export interface LoginPayload {
  userName: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  token: string;
}

export interface TokenResponse {
  token: string;
}

export interface UserAccount {
  userId: string;
  username: string;
  books?: Book[];
}

export interface CreateUserResponse {
  userID: string;
  username: string;
}
