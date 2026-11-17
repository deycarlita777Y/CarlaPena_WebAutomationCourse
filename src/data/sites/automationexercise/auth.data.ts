// automationexercise.com — credentials that do not match any registered account
export const invalidAutomationExerciseUser = {
  email: 'test@gmail.com',
  password: '123456',
} as const;

export const automationExerciseLoginMessages = {
  incorrectCredentials: 'Your email or password is incorrect!',
} as const;
