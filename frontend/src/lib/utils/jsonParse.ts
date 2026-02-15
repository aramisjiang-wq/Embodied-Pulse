/**
 * JSON字段解析工具函数
 * 用于处理数据库中存储为JSON字符串的字段
 */

/**
 * 解析JSON字段
 * @param field 可能是JSON字符串、数组或null/undefined的字段
 * @param defaultValue 默认值
 * @returns 解析后的数组
 */
export function parseJsonField<T = unknown>(
  field: string | T[] | null | undefined,
  defaultValue: T[] = []
): T[] {
  // 如果为空，返回默认值
  if (!field) return defaultValue;
  
  // 如果已经是数组，直接返回
  if (Array.isArray(field)) return field;
  
  // 尝试解析JSON字符串
  try {
    const parsed = JSON.parse(field as string);
    return Array.isArray(parsed) ? parsed : defaultValue;
  } catch (error) {
    console.warn('JSON parse error:', error);
    return defaultValue;
  }
}

/**
 * 格式化作者列表
 * @param authors 作者字段
 * @param maxCount 最多显示数量
 * @returns 格式化后的字符串
 */
export function formatAuthors(
  authors: string | string[] | null | undefined,
  maxCount: number = 3
): string {
  const authorList = parseJsonField<string>(authors, []);
  if (authorList.length === 0) return '未知作者';
  
  const displayAuthors = authorList.slice(0, maxCount);
  const remaining = authorList.length - maxCount;
  
  return displayAuthors.join(', ') + (remaining > 0 ? ` 等${remaining}人` : '');
}

/**
 * 解析并获取标签列表
 * @param tags 标签字段
 * @param maxCount 最多显示数量
 * @returns 标签数组
 */
export function parseTags(
  tags: string | string[] | null | undefined,
  maxCount?: number
): string[] {
  const tagList = parseJsonField<string>(tags, []);
  return maxCount ? tagList.slice(0, maxCount) : tagList;
}

/**
 * 解析分类列表
 * @param categories 分类字段
 * @param maxCount 最多显示数量
 * @returns 分类数组
 */
export function parseCategories(
  categories: string | string[] | null | undefined,
  maxCount?: number
): string[] {
  const categoryList = parseJsonField<string>(categories, []);
  return maxCount ? categoryList.slice(0, maxCount) : categoryList;
}

/**
 * 解析主题列表
 * @param topics 主题字段
 * @param maxCount 最多显示数量
 * @returns 主题数组
 */
export function parseTopics(
  topics: string | string[] | null | undefined,
  maxCount?: number
): string[] {
  const topicList = parseJsonField<string>(topics, []);
  return maxCount ? topicList.slice(0, maxCount) : topicList;
}
