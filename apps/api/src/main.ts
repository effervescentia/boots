import { App } from './app/app.module';
import { EnvironmentGlobal } from './env/env.global';

App.use((app) => app.listen(EnvironmentGlobal.data.PORT));
