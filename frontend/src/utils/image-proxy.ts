export function getProxyImageUrl(originalUrl: string): string {
  if (!originalUrl) return '';

  if (originalUrl.includes('i0.hdslb.com') || 
      originalUrl.includes('i1.hdslb.com') || 
      originalUrl.includes('i2.hdslb.com') ||
      originalUrl.includes('hdslb.com')) {
    return `http://localhost:3001/api/proxy/image?url=${encodeURIComponent(originalUrl)}`;
  }

  return originalUrl;
}