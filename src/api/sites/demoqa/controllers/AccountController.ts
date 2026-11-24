import { ApiClient } from '@api/client/ApiClient';
import { AccountEndpoints } from '@api/sites/demoqa/endpoints/account.endpoints';
import {
  CreateUserResponse,
  LoginPayload,
  LoginResponse,
  TokenResponse,
  UserAccount,
} from '@api/sites/demoqa/models/account.model';

export class AccountController {
  constructor(private readonly client: ApiClient) {}

  /** Logs in through the API, sets the bearer token on the client and returns the user id. */
  async authenticate(username: string, password: string): Promise<string> {
    const payload: LoginPayload = { userName: username, password };
    const { userId, token } = await this.client.post<LoginResponse>(AccountEndpoints.login, payload);
    this.client.setAuthToken(token);
    return userId;
  }

  /**
   * Registers a new account and returns its user id. The account is activated with one GenerateToken
   * call: until then the token returned by login is rejected (401). Calling it on every authenticate
   * breaks UI sessions (TC07), so it happens only here.
   */
  async createUser(username: string, password: string): Promise<string> {
    const payload: LoginPayload = { userName: username, password };
    const { userID } = await this.client.post<CreateUserResponse>(AccountEndpoints.createUser, payload);
    await this.client.post<TokenResponse>(AccountEndpoints.generateToken, payload);
    return userID;
  }

  /** Deletes the account. Requires an authenticated client (call authenticate first). */
  deleteUser(userId: string): Promise<void> {
    return this.client.delete(AccountEndpoints.user(userId));
  }

  getUser(userId: string): Promise<UserAccount> {
    return this.client.get<UserAccount>(AccountEndpoints.user(userId));
  }
}
