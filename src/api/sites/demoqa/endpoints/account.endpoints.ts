export const AccountEndpoints = {
  login: '/Account/v1/Login',
  user: (userId: string) => `/Account/v1/User/${userId}`,
} as const;
