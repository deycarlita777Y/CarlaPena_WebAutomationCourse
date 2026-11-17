import { ApiClient } from '@api/client/ApiClient';
import { AccountEndpoints } from '@api/sites/demoqa/endpoints/account.endpoints';
import { LoginPayload, LoginResponse, UserAccount } from '@api/sites/demoqa/models/account.model';

export class AccountController {
  constructor(private readonly client: ApiClient) {}

  /** Logs in through the API, sets the bearer token on the client and returns the user id. */
  async authenticate(username: string, password: string): Promise<string> {
    const payload: LoginPayload = { userName: username, password };
    const { userId, token } = await this.client.post<LoginResponse>(AccountEndpoints.login, payload);
    this.client.setAuthToken(token);
    return userId;
  }

  getUser(userId: string): Promise<UserAccount> {
    return this.client.get<UserAccount>(AccountEndpoints.user(userId));
  }
}
