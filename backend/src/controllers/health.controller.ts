import { FastifyRequest, FastifyReply } from 'fastify';
import { BaseController } from './base';
import { HealthService } from '../services/health.service';

export class HealthController extends BaseController {
  constructor(private healthService: HealthService) {
    super();
  }

  /**
   * Health check endpoint
   */
  async check(request: FastifyRequest, reply: FastifyReply) {
    try {
      const health = await this.healthService.checkHealth();

      if (health.database === 'connected') {
        return this.success(reply, health, 'Service is healthy');
      } else {
        return this.error(reply, 'Service unhealthy', 503, 'SERVICE_UNHEALTHY');
      }
    } catch (error) {
      return this.error(reply, 'Health check failed', 503, 'HEALTH_CHECK_FAILED');
    }
  }
}