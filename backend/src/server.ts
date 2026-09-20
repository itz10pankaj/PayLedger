import { app } from './app';
import { env } from './config/env';

app.listen(env.port, () => {
  console.log(`[backend] listening on port ${env.port} (${env.nodeEnv})`);
});
