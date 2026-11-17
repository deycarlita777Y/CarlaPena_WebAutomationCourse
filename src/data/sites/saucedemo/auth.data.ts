import { Env } from '@config/Env';

export const users = {
  appUser: {
    username: Env.testUser.name,
    password: Env.testUser.password,
  },
  lockedOutUser: {
    username: 'locked_out_user',
    password: 'secret_sauce',
  },
  problemUser: {
    username: 'problem_user',
    password: 'secret_sauce',
  },
  invalidUser: {
    username: 'standaruser',
    password: 'secret_sauce',
  },
} as const;

export const loginMessages = {
  invalidCredentials:
    'Epic sadface: Username and password do not match any user in this service',
} as const;
