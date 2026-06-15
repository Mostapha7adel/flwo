import Redis from 'ioredis'
import { config } from './index.js'

const redis = new Redis(config.REDIS_URL, {
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => Math.min(times * 100, 3000),
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
})

redis.on('connect', () => console.log('✅ Redis connected'))
redis.on('error', (err) => {
  if (err.code !== 'ECONNREFUSED') {
    console.error('❌ Redis error:', err)
  }
})

async function safeCall(fn, ...args) {
  try {
    if (redis.status !== 'ready') return null
    return await fn.call(redis, ...args)
  } catch {
    return null
  }
}

export { redis }
export const safeRedis = {
  get: (key) => safeCall(redis.get, key),
  setex: (key, ttl, value) => safeCall(redis.setex, key, ttl, value),
  set: (key, value) => safeCall(redis.set, key, value),
  del: (...keys) => safeCall(redis.del, ...keys),
  keys: (pattern) => safeCall(redis.keys, pattern),
  ping: () => safeCall(redis.ping),
  scan: (cursor, ...args) => safeCall(redis.scan, cursor, ...args),
  scanStream: (opts) => redis.scanStream(opts),
  pipeline: () => redis.pipeline(),
  ttl: (key) => safeCall(redis.ttl, key),
  expire: (key, ttl) => safeCall(redis.expire, key, ttl),
}


