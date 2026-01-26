export const parseSetCookie = (headers: Headers) =>
  Object.fromEntries(
    headers
      .getSetCookie()
      .map((cookie) => new Bun.Cookie(cookie))
      .map((cookie) => [cookie.name, cookie.value]),
  );
