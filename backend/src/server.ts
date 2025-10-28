import Fastify from 'fastify';

const server = Fastify({ logger: true });

server.get('/', async (request, reply) => {
  return { hello: 'Fastify (TypeScript) is running' };
});

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    server.log.info('Server listening on port 3000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
