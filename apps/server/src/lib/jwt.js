import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { safeRedis } from '../config/redis.js'

export function signAccessToken(userId, role) {
  return jwt.sign(
    { sub: userId, role, type: 'access' },
    config.JWT_ACCESS_SECRET,
    { expiresIn: config.JWT_ACCESS_EXPIRES }
  )
}

export function signRefreshToken(userId) {
  return jwt.sign(
    { sub: userId, type: 'refresh' },
    config.JWT_REFRESH_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRES }
  )
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.JWT_ACCESS_SECRET)
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, config.JWT_REFRESH_SECRET)
}

export async function blacklistToken(token) {
  const decoded = jwt.decode(token)
  if (!decoded?.exp) return
  const ttl = decoded.exp - Math.floor(Date.now() / 1000)
  if (ttl > 0) await safeRedis.setex(`blacklist:${token}`, ttl, '1')
}

export async function verifySocketToken(token) {
  try {
    const decoded = verifyAccessToken(token)
    const isBlacklisted = await safeRedis.get(`blacklist:${token}`)
    if (isBlacklisted) return null
    return decoded
  } catch {
    return null
  }
}
