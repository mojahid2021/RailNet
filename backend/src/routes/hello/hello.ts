import { FastifyPluginAsync } from 'fastify';

/**
 * Hello route
 * - GET /hello
 * - Response: { message: string }
 *
 * Folderized under `src/routes/hello` so each route can grow its own
 * handlers, schemas and tests independently.
 **/

const helloRoute: FastifyPluginAsync = async (server) => {
  server.get(
    '/hello',
    {
      schema: {
        description: 'Hello endpoint',
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            },
            required: ['message']
          }
        }
      }
    },
    async () => ({ message: 'Hello from Fastify (TypeScript)!' })
  );
};

export default helloRoute;