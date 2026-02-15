import prisma from '../config/database';
import { logger } from '../utils/logger';

export interface CreateCustomPageData {
  slug: string;
  title: string;
  content: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCustomPageData {
  slug?: string;
  title?: string;
  content?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CustomPageListParams {
  page?: number;
  size?: number;
  isActive?: boolean;
}

class CustomPageService {
  async create(data: CreateCustomPageData) {
    const page = await prisma.customPage.create({
      data: {
        slug: data.slug,
        title: data.title,
        content: data.content,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    });
    return page;
  }

  async update(id: string, data: UpdateCustomPageData) {
    const page = await prisma.customPage.update({
      where: { id },
      data,
    });
    return page;
  }

  async delete(id: string) {
    await prisma.customPage.delete({
      where: { id },
    });
  }

  async getById(id: string) {
    const page = await prisma.customPage.findUnique({
      where: { id },
    });
    return page;
  }

  async getBySlug(slug: string) {
    const page = await prisma.customPage.findUnique({
      where: { slug },
    });
    return page;
  }

  async list(params: CustomPageListParams) {
    const page = params.page ?? 1;
    const size = params.size ?? 20;
    const skip = (page - 1) * size;

    const where: any = {};
    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const [items, total] = await Promise.all([
      prisma.customPage.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        skip,
        take: size,
      }),
      prisma.customPage.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size),
        hasNext: page * size < total,
        hasPrev: page > 1,
      },
    };
  }

  async listActive() {
    const pages = await prisma.customPage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        sortOrder: true,
      },
    });
    return pages;
  }
}

export const customPageService = new CustomPageService();
