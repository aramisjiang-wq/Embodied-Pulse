import { getCachedQuery, invalidateCache, buildKey } from '../services/query-cache.service';

export function CacheQuery(ttl: number = 300, keyPrefix?: string) {
  return function (
    target: Record<string, unknown>,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const cacheKey = buildKey(
        keyPrefix || `${target.constructor.name}.${propertyKey}`,
        { args }
      );

      return getCachedQuery(
        cacheKey,
        () => originalMethod.apply(this, args),
        { ttl }
      );
    };

    return descriptor;
  };
}

export function InvalidateCache(pattern: string) {
  return function (
    target: Record<string, unknown>,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const result = await originalMethod.apply(this, args);
      await invalidateCache(pattern);
      return result;
    };

    return descriptor;
  };
}
