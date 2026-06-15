export function getPagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 12))
  return { page, limit, skip: (page - 1) * limit }
}

export function paginatedResponse(data, total, page, limit) {
  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total,
  }
}
