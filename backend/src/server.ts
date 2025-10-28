import Fastify from 'fastify';
import { registerRoutes } from './routes';

const server = Fastify({ logger: true });

// lightweight root route (keeps quick sanity check)
server.get('/', async () => ({ hello: 'Fastify (TypeScript) is running' }));

const start = async () => {
  try {
    // register all application routes (folderized)
    await registerRoutes(server);

    await server.listen({ port: 3000, host: '0.0.0.0' });
    server.log.info('Server listening on port 3000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// when this file is executed directly, start the server
if (require.main === module) {
  start();
}

export default server;
