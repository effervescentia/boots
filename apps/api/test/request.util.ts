export const setAuthPrincipal = (principalID: string) => ({ 'test-principal': principalID });

export const unwrap = async (res: Response) => {
  if (res.ok) return res.json();

  throw new Error(await res.text());
};
