import { FastifyPluginAsync } from 'fastify';
import { HelloController } from '../../controllers/hello.controller';

/**
 * Hello route
 * - GET /hello
 * - Response: { message: string }
 */
const helloRoute: FastifyPluginAsync = async (server) => {
  const helloController = new HelloController();

  server.get(
    '/hello',
    {
      schema: {
        description: 'Hello endpoint',
        tags: ['General'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                },
              },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    (request, reply) => helloController.greet(request, reply)
  );
};

export default helloRoute;