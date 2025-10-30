export function parseCookieStringToObject(cookieHeader: string) {
  return Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [key, value] = c.trim().split('=');
      return [key, decodeURIComponent(value)];
    }),
  );
}
