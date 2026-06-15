import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { safeRedis } from '../config/redis.js'
import { AppError } from '../lib/AppError.js'
import { prisma } from '../config/database.js'
import { SAFE_USER_SELECT, ROLE_HIERARCHY, CACHE_PREFIX } from '../lib/constants.js'

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('لم يتم توفير رمز المصادقة', 401, 'NO_TOKEN')
    }
    const token = authHeader.split(' ')[1]

    const isBlacklisted = await safeRedis.get(CACHE_PREFIX.BLACKLIST(token))
    if (isBlacklisted) throw new AppError('رمز المصادقة ملغي', 401, 'TOKEN_REVOKED')

    let decoded
    try {
      decoded = jwt.verify(token, config.JWT_ACCESS_SECRET)
    } catch (err) {
      if (err.name === 'TokenExpiredError') throw new AppError('انتهت صلاحية الجلسة', 401, 'TOKEN_EXPIRED')
      throw new AppError('رمز المصادقة غير صحيح', 401, 'INVALID_TOKEN')
    }

    const isSuspended = await safeRedis.get(CACHE_PREFIX.SUSPENDED(decoded.sub))
    if (isSuspended) throw new AppError('بيانات تسجيل الدخول غير صحيحة', 401, 'INVALID_CREDENTIALS')

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { ...SAFE_USER_SELECT, bannedUntil: true },
    })

    if (!user || !user.isActive) {
      throw new AppError('بيانات تسجيل الدخول غير صحيحة', 401, 'INVALID_CREDENTIALS')
    }

    if (user.bannedUntil && new Date(user.bannedUntil) > new Date()) {
      throw new AppError('تم حظر حسابك مؤقتاً', 403, 'ACCOUNT_BANNED')
    }

    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError('غير مصادق', 401, 'UNAUTHORIZED'))
    if (!roles.includes(req.user.role)) {
      return next(new AppError('ليس لديك صلاحية', 403, 'FORBIDDEN'))
    }
    next()
  }
}

export const requireAdmin = requireRole('ADMIN', 'SUPER_ADMIN')
export const requireSupport = requireRole('ADMIN', 'SUPPORT', 'ACCOUNTS', 'SUPER_ADMIN')

export function canModifyUser(actorRole, targetRole) {
  const allowed = ROLE_HIERARCHY[actorRole] || []
  return allowed.includes(targetRole)
}
