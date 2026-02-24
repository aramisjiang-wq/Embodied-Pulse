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

const SLUG_REGEX = /^[a-z0-9-]+$/;
const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 100000;
const MAX_SORT_ORDER = 9999;

function validateSlug(slug: string): string | null {
  if (!slug || typeof slug !== 'string') {
    return 'Slug不能为空';
  }
  if (slug.length > 100) {
    return 'Slug长度不能超过100个字符';
  }
  if (!SLUG_REGEX.test(slug)) {
    return 'Slug只能包含小写字母、数字和连字符';
  }
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return 'Slug不能以连字符开头或结尾';
  }
  return null;
}

function validateTitle(title: string): string | null {
  if (!title || typeof title !== 'string') {
    return '标题不能为空';
  }
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return '标题不能为空';
  }
  if (trimmed.length > MAX_TITLE_LENGTH) {
    return `标题长度不能超过${MAX_TITLE_LENGTH}个字符`;
  }
  return null;
}

function validateContent(content: string): string | null {
  if (!content || typeof content !== 'string') {
    return '内容不能为空';
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return `内容长度不能超过${MAX_CONTENT_LENGTH}个字符`;
  }
  return null;
}

function validateSortOrder(sortOrder: number | undefined): string | null {
  if (sortOrder === undefined) {
    return null;
  }
  if (typeof sortOrder !== 'number' || !Number.isInteger(sortOrder)) {
    return '排序必须是整数';
  }
  if (sortOrder < 0 || sortOrder > MAX_SORT_ORDER) {
    return `排序必须在0-${MAX_SORT_ORDER}之间`;
  }
  return null;
}

class CustomPageService {
  async create(data: CreateCustomPageData) {
    const slugError = validateSlug(data.slug);
    if (slugError) {
      throw new Error(slugError);
    }

    const titleError = validateTitle(data.title);
    if (titleError) {
      throw new Error(titleError);
    }

    const contentError = validateContent(data.content);
    if (contentError) {
      throw new Error(contentError);
    }

    const sortOrderError = validateSortOrder(data.sortOrder);
    if (sortOrderError) {
      throw new Error(sortOrderError);
    }

    const existingPage = await (prisma as any).custom_pages.findUnique({
      where: { slug: data.slug },
    });
    if (existingPage) {
      throw new Error(`Slug "${data.slug}" 已存在，请使用其他Slug`);
    }

    const page = await (prisma as any).custom_pages.create({
      data: {
        id: crypto.randomUUID(),
        slug: data.slug.trim(),
        title: data.title.trim(),
        content: data.content,
        is_active: data.isActive ?? true,
        sort_order: data.sortOrder ?? 0,
        updated_at: new Date(),
      },
    });
    logger.info(`Created custom page: ${data.slug}`);
    return this.transformPage(page);
  }

  async update(id: string, data: UpdateCustomPageData) {
    if (!id || typeof id !== 'string') {
      throw new Error('无效的页面ID');
    }

    const existingPage = await (prisma as any).custom_pages.findUnique({
      where: { id },
    });
    if (!existingPage) {
      throw new Error('页面不存在');
    }

    if (data.slug !== undefined) {
      const slugError = validateSlug(data.slug);
      if (slugError) {
        throw new Error(slugError);
      }

      if (data.slug !== existingPage.slug) {
        const slugExists = await (prisma as any).custom_pages.findUnique({
          where: { slug: data.slug },
        });
        if (slugExists) {
          throw new Error(`Slug "${data.slug}" 已存在，请使用其他Slug`);
        }
      }
    }

    if (data.title !== undefined) {
      const titleError = validateTitle(data.title);
      if (titleError) {
        throw new Error(titleError);
      }
    }

    if (data.content !== undefined) {
      const contentError = validateContent(data.content);
      if (contentError) {
        throw new Error(contentError);
      }
    }

    const sortOrderError = validateSortOrder(data.sortOrder);
    if (sortOrderError) {
      throw new Error(sortOrderError);
    }

    const updateData: any = { updated_at: new Date() };
    if (data.slug !== undefined) updateData.slug = data.slug.trim();
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.content !== undefined) updateData.content = data.content;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.sortOrder !== undefined) updateData.sort_order = data.sortOrder;

    const page = await (prisma as any).custom_pages.update({
      where: { id },
      data: updateData,
    });
    logger.info(`Updated custom page: ${id}`);
    return this.transformPage(page);
  }

  async delete(id: string) {
    if (!id || typeof id !== 'string') {
      throw new Error('无效的页面ID');
    }

    const existingPage = await (prisma as any).custom_pages.findUnique({
      where: { id },
    });
    if (!existingPage) {
      throw new Error('页面不存在');
    }

    await (prisma as any).custom_pages.delete({
      where: { id },
    });
    logger.info(`Deleted custom page: ${id}`);
  }

  async getById(id: string) {
    if (!id || typeof id !== 'string') {
      throw new Error('无效的页面ID');
    }

    const page = await (prisma as any).custom_pages.findUnique({
      where: { id },
    });
    return page ? this.transformPage(page) : null;
  }

  async getBySlug(slug: string) {
    if (!slug || typeof slug !== 'string') {
      return null;
    }

    const page = await (prisma as any).custom_pages.findUnique({
      where: { slug },
    });
    return page ? this.transformPage(page) : null;
  }

  async list(params: CustomPageListParams) {
    const page = Math.max(1, params.page ?? 1);
    const size = Math.min(100, Math.max(1, params.size ?? 20));
    const skip = (page - 1) * size;

    const where: any = {};
    if (params.isActive !== undefined) {
      where.is_active = params.isActive;
    }

    const [items, total] = await Promise.all([
      (prisma as any).custom_pages.findMany({
        where,
        orderBy: { sort_order: 'asc' },
        skip,
        take: size,
      }),
      (prisma as any).custom_pages.count({ where }),
    ]);

    return {
      items: items.map((item: any) => this.transformPage(item)),
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
    const pages = await (prisma as any).custom_pages.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        sort_order: true,
      },
    });
    return pages.map((page: any) => ({
      id: page.id,
      slug: page.slug,
      title: page.title,
      sortOrder: page.sort_order,
    }));
  }

  private transformPage(page: any) {
    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      content: page.content,
      isActive: page.is_active,
      sortOrder: page.sort_order,
      createdAt: page.created_at,
      updatedAt: page.updated_at,
    };
  }
}

export const customPageService = new CustomPageService();
