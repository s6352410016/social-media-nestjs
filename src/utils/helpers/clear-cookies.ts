import { Response as ExpressResponse } from 'express';

export function clearCookies(res: ExpressResponse, ...cookieKeys: string[]) {
  cookieKeys.forEach((key) => {
    res.clearCookie(key);
  });
}
