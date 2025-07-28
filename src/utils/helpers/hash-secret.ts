import * as bcrypt from 'bcrypt';

export function hashSecret(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}