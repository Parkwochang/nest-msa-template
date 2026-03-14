export const REDIS_CACHE = 'REDIS_CACHE';

export const REDIS_PUB = 'REDIS_PUB';

export const REDIS_SUB = 'REDIS_SUB';

export const getRedisToken = (name: string) => `${REDIS_CACHE}_${name}`;
