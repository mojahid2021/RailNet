import { FastifyRequest, FastifyReply } from 'fastify';
import { BaseController } from './base';

export class HelloController extends BaseController {
  /**
   * Hello endpoint
   */
  async greet(request: FastifyRequest, reply: FastifyReply) {
    return this.success(reply, { message: 'Hello from RailNet API!' });
  }
}