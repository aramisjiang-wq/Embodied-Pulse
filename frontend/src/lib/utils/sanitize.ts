const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'blockquote', 'pre', 'code',
  'a', 'img',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'div', 'span',
  'hr',
];

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  table: ['border', 'cellpadding', 'cellspacing'],
  td: ['colspan', 'rowspan'],
  th: ['colspan', 'rowspan'],
  div: ['class'],
  span: ['class'],
};

const DANGEROUS_PROTOCOLS = ['javascript:', 'vbscript:', 'data:', 'file:'];

export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  let sanitized = html;

  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]+/gi, '');

  sanitized = sanitized.replace(/<(\w+)([^>]*)>/g, (match: string, tagName: string, attributes: string) => {
    const tag = tagName.toLowerCase();

    if (!ALLOWED_TAGS.includes(tag)) {
      return '';
    }

    const allowedAttrs = ALLOWED_ATTRIBUTES[tag] || [];
    if (allowedAttrs.length === 0) {
      return `<${tag}>`;
    }

    const cleanAttrs = attributes.replace(/(\w+)\s*=\s*["']([^"']*)["']/g, (attrMatch: string, attrName: string, attrValue: string) => {
      const attr = attrName.toLowerCase();

      if (!allowedAttrs.includes(attr)) {
        return '';
      }

      if (attr === 'href' || attr === 'src') {
        const protocol = attrValue.trim().toLowerCase().split(':')[0];
        if (DANGEROUS_PROTOCOLS.includes(protocol + ':')) {
          return '';
        }
      }

      return `${attrName}="${attrValue}"`;
    });

    return `<${tag}${cleanAttrs}>`;
  });

  sanitized = sanitized.replace(/<\/(\w+)>/g, (match: string, tagName: string) => {
    const tag = tagName.toLowerCase();
    return ALLOWED_TAGS.includes(tag) ? `</${tag}>` : '';
  });

  return sanitized;
}

export function stripHtmlTags(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  return html.replace(/<[^>]*>/g, '').trim();
}

export function truncateHtml(html: string, maxLength: number): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const text = stripHtmlTags(html);
  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength) + '...';
}
