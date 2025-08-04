export function isStringExceptionResponse(
  exceptionResponse: string | object,
): exceptionResponse is string {
  return typeof exceptionResponse === 'string';
}

export function isObjectExceptionResponse(
  exceptionResponse: string | object,
): exceptionResponse is object {
  return typeof exceptionResponse === 'object';
}