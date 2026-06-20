import { success, created, paginated } from '../../lib/response.js'
import { getPagination } from '../../lib/pagination.js'
import * as reviewsService from './reviews.service.js'

export async function list(req, res, next) {
  try {
    const { page, limit } = getPagination(req.query)
    const result = await reviewsService.getTemplateReviews(req.params.templateId, { page, limit })
    paginated(res, { reviews: result.reviews, page: result.page, totalPages: result.totalPages }, result.total, result.page, limit)
  } catch (err) { next(err) }
}

export async function stats(req, res, next) {
  try {
    const data = await reviewsService.getTemplateStats(req.params.templateId)
    success(res, data)
  } catch (err) { next(err) }
}

export async function create(req, res, next) {
  try {
    const review = await reviewsService.createReview(req.params.templateId, req.user.id, req.validatedData)
    created(res, review)
  } catch (err) { next(err) }
}

export async function remove(req, res, next) {
  try {
    await reviewsService.deleteReview(req.params.id, req.user.id)
    success(res, null, 'تم حذف التقييم')
  } catch (err) { next(err) }
}
