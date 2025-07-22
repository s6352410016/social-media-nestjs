import { ValidationError } from 'class-validator';

export function isValidationErrorArray(error: unknown): error is ValidationError[] {
  return Array.isArray(error) && error.every(e => e instanceof ValidationError);
}

export function handleValidationErrorMsg(error: ValidationError[]): string {
  return error
    .map((err) => Object.values(err.constraints || {}).join(', '))
    .join('; ');
}