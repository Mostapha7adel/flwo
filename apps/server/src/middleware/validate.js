import fs from 'fs'

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = source === 'body' ? req.body
               : source === 'params' ? req.params
               : req.query

    const result = schema.safeParse(data)
    if (!result.success) {
      if (req.file?.path) {
        fs.unlink(req.file.path, () => {})
      }
      return res.status(400).json({
        error: 'بيانات غير صحيحة',
        code: 'VALIDATION_ERROR',
        details: result.error.flatten().fieldErrors
      })
    }
    req.validatedData = result.data
    next()
  }
}
