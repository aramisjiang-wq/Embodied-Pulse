/**
 * HTML工具函数
 * 用于清理和转义HTML内容
 */

/**
 * 移除HTML标签，只保留纯文本
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  
  // 如果不在浏览器环境，使用正则表达式移除HTML标签
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '');
  }
  
  // 创建一个临时DOM元素来解析HTML
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  
  // 获取纯文本内容
  return tmp.textContent || tmp.innerText || '';
}

/**
 * 转义HTML特殊字符
 */
export function escapeHtml(text: string): string {
  if (!text) return '';
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * 清理文本中的HTML标签和特殊字符
 * @param text 要清理的文本
 * @param preserveNewlines 是否保留换行符（用于新闻等需要段落格式的内容）
 */
export function cleanText(text: string, preserveNewlines: boolean = false): string {
  if (!text) return '';
  
  if (typeof text !== 'string') {
    return String(text);
  }
  
  let cleaned = text.replace(/<[^>]+>/g, '');
  
  if (typeof document !== 'undefined') {
    try {
      const tmp = document.createElement('div');
      tmp.innerHTML = text;
      cleaned = tmp.textContent || tmp.innerText || cleaned;
    } catch (e) {
    }
  }
  
  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  if (preserveNewlines) {
    cleaned = cleaned
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      .trim();
  } else {
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
  }
  
  return cleaned;
}
