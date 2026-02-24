/**
 * 管理员审计日志服务
 */

import adminPrisma from '../config/database.admin';
import { logger } from '../utils/logger';

export interface CreateAuditLogParams {
  adminId: string;
  action: string;
  target?: string;
  details?: any;
  ip?: string;
}

export interface GetAuditLogsParams {
  adminId: string;
  page: number;
  size: number;
}

export async function createAuditLog(params: CreateAuditLogParams) {
  try {
    const log = await adminPrisma.admin_audit_logs.create({
      data: {
        admin_id: params.adminId,
        action: params.action,
        target: params.target || null,
        details: params.details ? JSON.stringify(params.details) : null,
        ip: params.ip || null,
      },
    });
    return log;
  } catch (error) {
    logger.error('Create audit log error:', error);
    throw error;
  }
}

export async function getAdminAuditLogs(params: GetAuditLogsParams) {
  const { adminId, page, size } = params;
  const skip = (page - 1) * size;

  try {
    const [logs, total] = await Promise.all([
      adminPrisma.admin_audit_logs.findMany({
        where: { admin_id: adminId },
        orderBy: { created_at: 'desc' },
        skip,
        take: size,
      }),
      adminPrisma.admin_audit_logs.count({
        where: { admin_id: adminId },
      }),
    ]);

    const items = logs.map(log => ({
      id: log.id,
      adminId: log.admin_id,
      action: log.action,
      target: log.target,
      details: log.details ? JSON.parse(log.details) : null,
      ip: log.ip,
      createdAt: log.created_at,
    }));

    return { items, total };
  } catch (error) {
    logger.error('Get admin audit logs error:', error);
    throw error;
  }
}

export async function logAdminAction(
  adminId: string,
  action: string,
  target?: string,
  details?: any,
  ip?: string
) {
  return createAuditLog({ adminId, action, target, details, ip });
}
