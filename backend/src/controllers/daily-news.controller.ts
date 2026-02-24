/**
 * 每日新闻控制器
 */

import { Request, Response } from 'express';
import { dailyNewsService } from '../services/daily-news.service';
import { logger } from '../utils/logger';

export async function getDailyNewsList(req: Request, res: Response) {
  try {
    const { page, size, isPinned } = req.query;
    const result = await dailyNewsService.findAll({
      page: page ? parseInt(page as string) : 1,
      size: size ? parseInt(size as string) : 20,
      isPinned: isPinned === 'true' ? true : isPinned === 'false' ? false : undefined,
    });
    res.json(result);
  } catch (error) {
    logger.error('Failed to fetch daily news list:', error);
    res.status(500).json({ error: 'Failed to fetch daily news list' });
  }
}

export async function getDailyNewsById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const news = await dailyNewsService.findById(id);
    if (!news) {
      return res.status(404).json({ error: 'Daily news not found' });
    }
    res.json(news);
  } catch (error) {
    logger.error('Failed to fetch daily news:', error);
    res.status(500).json({ error: 'Failed to fetch daily news' });
  }
}

export async function getPinnedDailyNews(req: Request, res: Response) {
  try {
    const news = await dailyNewsService.getPinned();
    res.json(news);
  } catch (error) {
    logger.error('Failed to fetch pinned daily news:', error);
    res.status(500).json({ error: 'Failed to fetch pinned daily news' });
  }
}

export async function createDailyNews(req: Request, res: Response) {
  try {
    const news = await dailyNewsService.create(req.body);
    res.status(201).json(news);
  } catch (error) {
    logger.error('Failed to create daily news:', error);
    res.status(500).json({ error: 'Failed to create daily news' });
  }
}

export async function updateDailyNews(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const news = await dailyNewsService.update(id, req.body);
    res.json(news);
  } catch (error) {
    logger.error('Failed to update daily news:', error);
    res.status(500).json({ error: 'Failed to update daily news' });
  }
}

export async function deleteDailyNews(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await dailyNewsService.delete(id);
    res.status(204).send();
  } catch (error) {
    logger.error('Failed to delete daily news:', error);
    res.status(500).json({ error: 'Failed to delete daily news' });
  }
}

export async function toggleDailyNewsPin(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const news = await dailyNewsService.togglePin(id);
    res.json(news);
  } catch (error) {
    logger.error('Failed to toggle pin status:', error);
    res.status(500).json({ error: 'Failed to toggle pin status' });
  }
}
