import { test, expect } from '@fixtures';
import { Env } from '@config/Env';
import {
  invalidAutomationExerciseUser,
  automationExerciseLoginMessages,
} from '@data/auth.data';

test.use({ baseURL: Env.automationExerciseUrl });

test.describe('Login', () => {
  test('TC3: Login user with incorrect email and password shows an error', async ({
    homePage,
    signupLoginPage,
  }) => {
    await test.step('Verify the home page is visible', async () => {
      await expect(homePage.homeLink).toBeVisible();
    });

    await test.step('Open the Signup / Login page', async () => {
      await homePage.openSignupLogin();
      await expect(signupLoginPage.loginHeading).toBeVisible();
    });

    await test.step('Log in with incorrect email and password', async () => {
      await signupLoginPage.login(
        invalidAutomationExerciseUser.email,
        invalidAutomationExerciseUser.password,
      );
    });

    await test.step('Verify the incorrect credentials error is visible', async () => {
      await expect(signupLoginPage.errorMessage).toBeVisible();
      await expect(signupLoginPage.errorMessage).toHaveText(
        automationExerciseLoginMessages.incorrectCredentials,
      );
    });
  });
});
