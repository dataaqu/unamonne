import { compare, hash } from "bcryptjs";

/**
 * Password hashing for the Credentials provider. bcryptjs is pure JS (no native
 * build step), which keeps it working on serverless/Fluid Compute.
 */
const SALT_ROUNDS = 12;

export function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(password, passwordHash);
}
