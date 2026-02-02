import { Home } from '@web/pages/home/home.page';
import { Login } from '@web/pages/login/login.page';
import { Signup } from '@web/pages/signup/signup.page';
import { themeClass } from '@web/styles/theme.css';
import { match } from 'ts-pattern';
import { useRoute } from './app.router';
import { secure, unsecure } from './app.util';

export const App: React.FC = () => {
  const route = useRoute();

  const page = match(route)

    .with(
      { name: 'signup' },
      unsecure(() => <Signup />),
    )

    .with(
      { name: 'login' },
      unsecure(() => <Login />),
    )

    .with(
      { name: 'home' },
      secure(() => <Home />),
    )

    .otherwise(() => null);

  return <div className={themeClass}>{page}</div>;
};
