import { atom } from 'jotai';

export interface Account {
  id: string;
  username: string;
}

export const accountAtom = atom<Account | null>(null);
