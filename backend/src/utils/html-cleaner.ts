export function stripHtmlTags(html: string): string {
  if (!html || typeof html !== 'string') {
    return html;
  }
  
  return html.replace(/<[^>]*>/g, '').trim();
}

export function cleanVideoTitle(title: string): string {
  if (!title || typeof title !== 'string') {
    return title;
  }
  
  return stripHtmlTags(title);
}

export function cleanDescription(description: string): string {
  if (!description || typeof description !== 'string') {
    return description;
  }
  
  return stripHtmlTags(description);
}