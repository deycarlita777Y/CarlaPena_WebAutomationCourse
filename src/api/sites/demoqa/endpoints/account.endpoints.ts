export const AccountEndpoints = {
  login: '/Account/v1/Login',
  /** Activates a freshly created account (login tokens are rejected until it has been called once) */
  generateToken: '/Account/v1/GenerateToken',
  /** POST creates a user; GET / DELETE act on `user(userId)` */
  createUser: '/Account/v1/User',
  user: (userId: string) => `/Account/v1/User/${userId}`,
} as const;
