import { APIRequestContext } from '@playwright/test';

interface RequestOptions {
  data?: unknown;
  params?: Record<string, string>;
}

/** Only HTTP entry point of the API layer — wraps APIRequestContext (base URL, auth header, status check). */
export class ApiClient {
  private token?: string;

  constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl = '',
  ) {}

  setAuthToken(token: string): void {
    this.token = token;
  }

  private buildHeaders(): Record<string, string> {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  private async check(
    method: string,
    url: string,
    response: { ok(): boolean; status(): number; text(): Promise<string> },
  ): Promise<void> {
    if (!response.ok()) {
      const body = await response.text().catch(() => '');
      throw new Error(`${method} ${url} failed — status ${response.status()}: ${body}`);
    }
  }

  async get<T>(url: string, options?: RequestOptions): Promise<T> {
    const response = await this.request.get(this.baseUrl + url, { ...options, headers: this.buildHeaders() });
    await this.check('GET', url, response);
    return response.json() as Promise<T>;
  }

  async post<T>(url: string, data: unknown): Promise<T> {
    const response = await this.request.post(this.baseUrl + url, { data, headers: this.buildHeaders() });
    await this.check('POST', url, response);
    return response.json() as Promise<T>;
  }

  async delete(url: string, options?: RequestOptions): Promise<void> {
    const response = await this.request.delete(this.baseUrl + url, { ...options, headers: this.buildHeaders() });
    await this.check('DELETE', url, response);
  }
}
