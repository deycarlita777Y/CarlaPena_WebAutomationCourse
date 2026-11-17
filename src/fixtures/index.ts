import { mergeTests, expect } from '@playwright/test';
import { test as saucedemoTest } from '@fixtures/sites/saucedemo.fixtures';
import { test as automationExerciseTest } from '@fixtures/sites/automationexercise.fixtures';
import { test as demoqaTest } from '@fixtures/sites/demoqa.fixtures';

// Re-export expect so all spec files import from '@fixtures' only
export { expect };

// One fixture file per site (src/fixtures/sites/), merged here so specs keep importing '@fixtures'
export const test = mergeTests(saucedemoTest, automationExerciseTest, demoqaTest);
