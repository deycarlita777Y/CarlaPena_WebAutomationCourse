import { Env } from '@config/Env';

export const bookStoreUsers = {
  appUser: {
    username: Env.demoqaUser.name,
    password: Env.demoqaUser.password,
  },
} as const;

/** Account used by the API teardown fixture (same account as the UI login). */
export const demoqaUser = bookStoreUsers.appUser;
