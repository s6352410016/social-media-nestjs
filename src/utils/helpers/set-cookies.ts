import { Response as ExpressResponse } from 'express';

export function setCookies(
  key: string[] | string,
  value: string[] | string,
  res: ExpressResponse,
) {
  if (Array.isArray(key) && Array.isArray(value)) {
    key.forEach((k, index) => {
      res.cookie(k, value[index], {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 1000 * 60 * 60,
      });
    });
  } else if (typeof key === 'string' && typeof value === 'string') {
    res.cookie(key, value, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 1000 * 60 * 60,
    });
  }
}