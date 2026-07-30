/**
 * How much a typed password is worth, on the same scale the register form
 * draws: 0 nothing typed, 1 too short to be accepted at all, 2 acceptable,
 * 3 long enough and mixed enough to be worth calling strong.
 *
 * Deliberately not a score out of 100. The meter exists to tell a person
 * whether to keep typing, and three answers is all that question has.
 */
export type PasswordStrength = 0 | 1 | 2 | 3;

/** The shortest password the register schema will accept. */
export const MIN_PASSWORD_LENGTH = 8;

export function passwordStrength(password: string): PasswordStrength {
  if (password.length === 0) return 0;
  if (password.length < MIN_PASSWORD_LENGTH) return 1;

  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  return hasDigit && hasSymbol ? 3 : 2;
}
