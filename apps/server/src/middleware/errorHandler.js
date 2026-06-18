import { Prisma } from '@prisma/client'

export function errorHandler(err, req, res, next) {
  if (!err.isOperational) {
    if (process.env.NODE_ENV === 'production') {
      console.error('💥 CRITICAL ERROR:', err.message)
    } else {
      console.error('💥 CRITICAL ERROR:', err)
    }
  }

  let statusCode = 500
  let message = 'حدث خطأ داخلي'
  let code = 'INTERNAL_ERROR'
  let details = null

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409; message = 'هذه البيانات مستخدمة بالفعل'; code = 'DUPLICATE_ENTRY'
    } else if (err.code === 'P2025') {
      statusCode = 404; message = 'العنصر غير موجود'; code = 'NOT_FOUND'
    }
  } else if (err.name === 'JsonWebTokenError' || err.name === 'JsonWebTokenError') {
    statusCode = 401; message = 'رمز المصادقة غير صحيح'; code = 'INVALID_TOKEN'
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401; message = 'انتهت صلاحية الجلسة'; code = 'TOKEN_EXPIRED'
  } else if (err.name === 'ZodError') {
    statusCode = 400; message = 'بيانات غير صحيحة'; code = 'VALIDATION_ERROR'
    details = err.flatten?.()?.fieldErrors || {}
  } else if (err.isOperational) {
    statusCode = err.statusCode; message = err.message; code = err.code
  }

  const body = { success: false, message, code }
  if (details) body.details = details
  return res.status(statusCode).json(body)
}
