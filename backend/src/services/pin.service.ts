/**
 * 通用置顶服务
 */

import { logger } from '../utils/logger';
import userPrisma from '../config/database.user';

const prisma = userPrisma;

const modelMap: Record<string, any> = {
  papers: prisma.paper,
  videos: prisma.video,
  repos: prisma.githubRepo,
  huggingface: prisma.huggingFaceModel,
  jobs: prisma.job,
  news: prisma.dailyNews,
};

export const pinService = {
  async togglePin(type: string, id: string) {
    const model = modelMap[type];
    if (!model) {
      throw new Error(`Unknown content type: ${type}`);
    }

    const item = await model.findUnique({ where: { id } }).catch((err: any) => {
      logger.error(`Failed to find ${type} with id ${id}:`, err);
      return null;
    });

    if (!item) {
      throw new Error('Content not found');
    }

    const newPinStatus = !item.isPinned;
    const now = new Date().toISOString();

    return model
      .update({
        where: { id },
        data: {
          isPinned: newPinStatus,
          pinnedAt: newPinStatus ? now : null,
        },
      })
      .catch((err: any) => {
        logger.error(`Failed to toggle pin for ${type} with id ${id}:`, err);
        throw err;
      });
  },

  async getPinnedItems(type?: string) {
    const types = type ? [type] : Object.keys(modelMap);
    const results: any[] = [];

    for (const t of types) {
      const model = modelMap[t];
      if (model) {
        try {
          const items = await model.findMany({
            where: { isPinned: true },
            orderBy: { pinnedAt: 'desc' },
          });
          results.push(
            ...items.map((item: any) => ({
              ...item,
              type: t === 'news' ? 'dailyNews' : t,
            }))
          );
        } catch (err) {
          logger.error(`Failed to fetch pinned items for ${t}:`, err);
        }
      }
    }

    return results.sort((a, b) => {
      const aTime = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
      const bTime = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
      return bTime - aTime;
    });
  },
};
