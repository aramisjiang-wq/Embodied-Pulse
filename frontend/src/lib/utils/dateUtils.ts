import dayjs from 'dayjs';
import type { CSSProperties } from 'react';

export type DateFreshness = 'today' | 'recent' | 'normal';

/**
 * 判断日期新鲜度
 * today   = 当天发布
 * recent  = 3天内发布
 * normal  = 更早
 */
export function getDateFreshness(date: string | Date | null | undefined): DateFreshness {
  if (!date) return 'normal';
  const d = dayjs(date);
  if (d.isSame(dayjs(), 'day')) return 'today';
  if (dayjs().diff(d, 'day') <= 3) return 'recent';
  return 'normal';
}

/**
 * 根据新鲜度返回显示文字
 * today  → "今日"
 * 其他   → 按 format 格式化（默认 YYYY-MM-DD）
 */
export function formatFreshDate(
  date: string | Date | null | undefined,
  format = 'YYYY-MM-DD'
): string {
  if (!date) return '';
  if (getDateFreshness(date) === 'today') return '今日';
  return dayjs(date).format(format);
}

/** 根据新鲜度返回内联样式对象 */
export function getDateStyle(date: string | Date | null | undefined): CSSProperties {
  const f = getDateFreshness(date);
  if (f === 'today') return { color: '#fb7299', fontWeight: 700 };
  if (f === 'recent') return { color: '#d46b08', fontWeight: 600 };
  return { color: '#555', fontWeight: 600 };
}
