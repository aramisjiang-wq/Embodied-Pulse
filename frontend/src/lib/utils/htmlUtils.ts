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
 */
export function cleanText(text: string): string {
  if (!text) return '';
  
  // 如果已经是纯文本，直接返回
  if (typeof text !== 'string') {
    return String(text);
  }
  
  // 先使用正则表达式移除所有HTML标签（包括嵌套的）
  let cleaned = text.replace(/<[^>]+>/g, '');
  
  // 如果在浏览器环境，使用DOM解析更准确
  if (typeof document !== 'undefined') {
    try {
      const tmp = document.createElement('div');
      tmp.innerHTML = text;
      cleaned = tmp.textContent || tmp.innerText || cleaned;
    } catch (e) {
      // 如果DOM解析失败，使用正则表达式结果
    }
  }
  
  // 解码HTML实体
  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  // 移除多余的空白字符
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}
