import { App } from './app/app.module';

App.use((app) => app.listen(app.decorator.env.PORT));
