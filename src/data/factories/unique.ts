import { Env } from '@config/Env';

/** Unique across workers: `Date.now()` alone is not. */
export const uniqueSuffix = (parallelIndex: number): string =>
  `${parallelIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/** Prefixed, unique name for any generated transactional record (orphans are found by the prefix). */
export const uniqueName = (label: string, parallelIndex: number): string =>
  `${Env.testDataPrefix}${label}_${uniqueSuffix(parallelIndex)}`;
