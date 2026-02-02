import { DialogProvider } from '@bltx/web';
import { client } from '@web/client';
import { accountAtom } from '@web/data/account.atom';
import { useSetup } from '@web/hooks/use-setup.hook';
import { unpack } from '@web/utils/request.util';
import { useSetAtom } from 'jotai';
import { useState } from 'react';
import { env } from './app.env';
import { RouteProvider } from './app.router';

export const AppProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const setAccount = useSetAtom(accountAtom);
  const [initialized, setInitialized] = useState(false);

  useSetup(async () => {
    env.init();

    try {
      const { account } = await client().auth.session.get().then(unpack);

      setAccount({
        id: account.id,
        username: account.username,
      });
    } catch (err) {
      console.warn('failed to reauthenticate', err);
    }

    setInitialized(true);
  });

  if (!initialized) return null;

  return (
    <RouteProvider>
      <DialogProvider>{children}</DialogProvider>
    </RouteProvider>
  );
};
