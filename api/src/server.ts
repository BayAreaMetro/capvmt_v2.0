import { createServer } from 'node:http';
import { app } from './app';
import { env } from './env';

createServer(app).listen(env.port, () => {
  console.log(`API listening on ${env.port}`);
});
