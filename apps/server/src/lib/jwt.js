import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { config } from '../config/index.js'
import { safeRedis } from '../config/redis.js'

const ISS = 'templyn-api'
const AUD_CLIENT = 'templyn-client'
const AUD_ADMIN = 'templyn-admin'

export function signAccessToken(userId, role) {
  return jwt.sign(
    { sub: userId, role, type: 'access', jti: randomUUID(), iss: ISS, aud: role === 'CLIENT' ? AUD_CLIENT : AUD_ADMIN },
    config.JWT_ACCESS_SECRET,
    { expiresIn: config.JWT_ACCESS_EXPIRES }
  )
}

export function signRefreshToken(userId) {
  return jwt.sign(
    { sub: userId, type: 'refresh', jti: randomUUID(), iss: ISS, aud: AUD_CLIENT },
    config.JWT_REFRESH_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRES }
  )
}

export function verifyAccessToken(token) {
  const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET)
  if (decoded.iss !== ISS) throw new Error('Invalid issuer')
  return decoded
}

export function verifyRefreshToken(token) {
  const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET)
  if (decoded.iss !== ISS) throw new Error('Invalid issuer')
  return decoded
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
