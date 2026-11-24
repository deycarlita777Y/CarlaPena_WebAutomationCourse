import { uniqueName } from '@data/factories/unique';

export interface DemoqaCredentials {
  username: string;
  password: string;
}

/**
 * Builds a unique, prefixed demoqa account for one worker. The password satisfies demoqa's
 * policy (upper, lower, digit, special, 8+ chars) and is generated, never stored.
 */
export function buildWorkerUser(parallelIndex: number): DemoqaCredentials {
  return {
    username: uniqueName('user', parallelIndex),
    password: `Aa1!${Math.random().toString(36).slice(2, 10)}`,
  };
}
