import { PrismaClient } from '../../node_modules/.prisma/client-admin';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.ADMIN_DATABASE_URL || 'file:./prisma/dev-admin.db',
    },
  },
});

export interface TechDebtItem {
  id: string;
  type: string;
  severity: string;
  title: string;
  description?: string;
  filePath?: string;
  line?: number;
  column?: number;
  ruleId?: string;
  status: string;
  assignee?: string;
  resolvedAt?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface TechDebtStats {
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
}

export class TechDebtService {
  static async getList(params: {
    type?: string;
    severity?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<{ items: TechDebtItem[]; total: number }> {
    const { type, severity, status, page = 1, size = 20 } = params;
    const where: any = {};
    
    if (type) where.type = type;
    if (severity) where.severity = severity;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.tech_debts.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * size,
        take: size,
      }),
      prisma.tech_debts.count({ where }),
    ]);

    return { items: items as TechDebtItem[], total };
  }

  static async getStats(): Promise<TechDebtStats> {
    const items = await prisma.tech_debts.findMany();
    
    const stats: TechDebtStats = {
      total: items.length,
      byType: {},
      bySeverity: {},
      byStatus: {},
    };

    for (const item of items) {
      stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
      stats.bySeverity[item.severity] = (stats.bySeverity[item.severity] || 0) + 1;
      stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;
    }

    return stats;
  }

  static async create(data: Omit<TechDebtItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<TechDebtItem> {
    const item = await prisma.tech_debts.create({
      data: {
        type: data.type,
        severity: data.severity,
        title: data.title,
        description: data.description,
        file_path: data.filePath,
        line: data.line,
        column: data.column,
        rule_id: data.ruleId,
        status: data.status,
        assignee: data.assignee,
      },
    });
    return item as TechDebtItem;
  }

  static async update(id: string, data: Partial<TechDebtItem>): Promise<TechDebtItem | null> {
    const updateData: any = {};
    if (data.severity) updateData.severity = data.severity;
    if (data.status) updateData.status = data.status;
    if (data.assignee) updateData.assignee = data.assignee;
    if (data.status === 'resolved') updateData.resolved_at = new Date();

    const item = await prisma.tech_debts.update({
      where: { id },
      data: updateData,
    });
    return item as TechDebtItem;
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await prisma.tech_debts.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  static async scanDependencies(): Promise<TechDebtItem[]> {
    const debts: TechDebtItem[] = [];
    
    try {
      const { stdout } = await execAsync('npm outdated --json', {
        cwd: process.cwd(),
      });
      
      if (stdout) {
        const outdated = JSON.parse(stdout);
        for (const [name, info] of Object.entries(outdated)) {
          const pkgInfo = info as { current: string; wanted: string; latest: string };
          debts.push({
            id: '',
            type: 'dependency',
            severity: pkgInfo.current !== pkgInfo.wanted ? 'high' : 'medium',
            title: `${name} 过期`,
            description: `当前: ${pkgInfo.current}, 最新: ${pkgInfo.latest}`,
            status: 'open',
            created_at: new Date(),
            updated_at: new Date(),
          });
        }
      }
    } catch {
      // npm outdated 返回非零退出码表示有过期包
    }

    return debts;
  }

  static async scanVulnerabilities(): Promise<TechDebtItem[]> {
    const debts: TechDebtItem[] = [];
    
    try {
      const { stdout } = await execAsync('npm audit --json', {
        cwd: process.cwd(),
      });
      
      if (stdout) {
        const audit = JSON.parse(stdout);
        const vulnerabilities = audit.vulnerabilities || {};
        
        for (const [name, info] of Object.entries(vulnerabilities)) {
          const vulnInfo = info as { severity?: string };
          debts.push({
            id: '',
            type: 'vulnerability',
            severity: vulnInfo.severity || 'high',
            title: `${name} 存在安全漏洞`,
            status: 'open',
            created_at: new Date(),
            updated_at: new Date(),
          });
        }
      }
    } catch {
      // npm audit 返回非零退出码表示有漏洞
    }

    return debts;
  }
}
