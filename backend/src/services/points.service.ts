import userPrisma from '../config/database.user';

const prisma = userPrisma;

export class PointsService {
  static async addPoints(userId: string, points: number, reason: string, relatedId?: string) {
    try {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId }
        });

        if (!user) {
          throw new Error('用户不存在');
        }

        const newPoints = user.points + points;

        await tx.user.update({
          where: { id: userId },
          data: { points: newPoints }
        });

        await tx.pointRecord.create({
          data: {
            user_id: userId,
            points,
            related_id: relatedId,
            balance_after: newPoints
          } as any
        });

        const newLevel = this.calculateLevel(newPoints);
        if (newLevel > user.level) {
          await tx.user.update({
            where: { id: userId },
            data: { level: newLevel }
          });
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Add points error:', error);
      return { success: false, error };
    }
  }

  static calculateLevel(points: number): number {
    if (points < 500) return Math.floor(points / 100) + 1;
    if (points < 2000) return Math.floor((points - 500) / 300) + 5;
    if (points < 5000) return Math.floor((points - 2000) / 600) + 10;
    return Math.floor((points - 5000) / 1000) + 15;
  }

  static async checkAchievements(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          _count: {
            select: {
              posts: true,
              comments: true,
              favorites: true
            }
          }
        }
      });

      if (!user) {
        return { success: false, error: '用户不存在' };
      }

      const achievements = [];

      if (user._count.posts >= 100) {
        achievements.push({ id: 'tech_master', name: '技术达人', icon: '🏆' });
      } else if (user._count.posts >= 50) {
        achievements.push({ id: 'active_creator', name: '活跃创作者', icon: '🌟' });
      } else if (user._count.posts >= 10) {
        achievements.push({ id: 'new_creator', name: '新晋创作者', icon: '🎯' });
      }

      if (user.points >= 5000) {
        achievements.push({ id: 'points_master', name: '积分大师', icon: '💎' });
      } else if (user.points >= 1000) {
        achievements.push({ id: 'points_expert', name: '积分专家', icon: '⭐' });
      }

      return { success: true, achievements };
    } catch (error) {
      console.error('Check achievements error:', error);
      return { success: false, error };
    }
  }
}
