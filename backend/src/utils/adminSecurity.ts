import { FastifyRequest, FastifyReply } from 'fastify'
import { ResponseHandler } from './response'

/**
 * Admin Security Utilities
 * Provides additional security measures for admin-only operations
 */
export class AdminSecurity {
  /**
   * Validate admin access and extract admin information
   * This is called after authenticateAdmin middleware
   */
  static validateAdminAccess(request: FastifyRequest, operation: string) {
    const admin = (request as any).admin

    if (!admin) {
      throw new Error('Admin authentication required')
    }

    if (admin.type !== 'admin') {
      throw new Error('Invalid admin token type')
    }

    // Log admin operation for audit trail
    console.log(`[ADMIN SECURITY] ${admin.id || 'unknown'} performing: ${operation} at ${new Date().toISOString()}`)

    return {
      adminId: admin.id,
      adminEmail: admin.email,
      operation,
      timestamp: new Date(),
    }
  }

  /**
   * Create audit log entry for admin actions
   */
  static logAdminAction(adminId: string, action: string, details?: any) {
    const logEntry = {
      adminId,
      action,
      details: details || {},
      timestamp: new Date().toISOString(),
      ip: 'system', // Could be enhanced to capture actual IP
    }

    console.log(`[ADMIN AUDIT] ${JSON.stringify(logEntry)}`)

    // In production, this could be sent to a logging service
    // or stored in a separate audit table
  }

  /**
   * Check if admin has permission for specific operation
   * Currently all admins have full access, but this can be extended
   * for role-based permissions in the future
   */
  static checkPermission(adminId: string, operation: string): boolean {
    // For now, all authenticated admins have full access
    // This can be extended with role-based permissions later
    const allowedOperations = [
      'create_schedule',
      'read_schedule',
      'list_schedules',
      'update_schedule',
      'delete_schedule',
    ]

    return allowedOperations.includes(operation)
  }
}