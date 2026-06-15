import { Prisma } from '@prisma/client'

export function errorHandler(err, req, res, next) {
  if (!err.isOperational) {
    if (process.env.NODE_ENV === 'production') {
      console.error('💥 CRITICAL ERROR:', err.message)
    } else {
      console.error('💥 CRITICAL ERROR:', err)
    }
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'هذه البيانات مستخدمة بالفعل', code: 'DUPLICATE_ENTRY' })
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'العنصر غير موجود', code: 'NOT_FOUND' })
    }
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'رمز المصادقة غير صحيح', code: 'INVALID_TOKEN' })
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'انتهت صلاحية الجلسة', code: 'TOKEN_EXPIRED' })
  }

  if (err.name === 'ZodError') {
    const fieldErrors = err.flatten?.()?.fieldErrors || {}
    return res.status(400).json({ error: 'بيانات غير صحيحة', code: 'VALIDATION_ERROR', details: fieldErrors })
  }

  if (err.isOperational) {
    return res.status(err.statusCode).json({ error: err.message, code: err.code })
  }

  return res.status(500).json({ error: 'حدث خطأ داخلي', code: 'INTERNAL_ERROR' })
}
