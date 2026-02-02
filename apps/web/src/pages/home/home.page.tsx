import { AppNavigation } from '@web/app/app.navigation';
import { routes } from '@web/app/app.router';
import { accountAtom } from '@web/data/account.atom';
import { useAtom } from 'jotai';

export const Home: React.FC = () => {
  const [account, setAccount] = useAtom(accountAtom);

  const logout = () => {
    setAccount(null);
    routes.login().replace();
  };

  return (
    <div>
      <AppNavigation />
      <h2>Home</h2>
      <strong>
        {account?.username} ({account?.id})
      </strong>
      <button type="button" onClick={logout}>
        logout
      </button>
    </div>
  );
};
