export function success(res, data = null, message = null, statusCode = 200, meta = null) {
  const body = { success: true }
  if (message) body.message = message
  if (data !== null) body.data = data
  if (meta) body.meta = meta
  return res.status(statusCode).json(body)
}

export function created(res, data = null, message = null) {
  return success(res, data, message, 201)
}

export function paginated(res, data, total, page, limit, message = null) {
  return success(res, data, message, 200, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  })
}
