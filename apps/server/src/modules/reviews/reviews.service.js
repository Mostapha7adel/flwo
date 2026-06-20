import { prisma } from '../../config/database.js'
import { AppError } from '../../lib/AppError.js'

export async function getTemplateReviews(templateId, { page = 1, limit = 10 }) {
  const [reviews, total] = await Promise.all([
    prisma.templateReview.findMany({
      where: { templateId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.templateReview.count({ where: { templateId } }),
  ])
  return { reviews, total, page, totalPages: Math.ceil(total / limit) }
}

export async function getTemplateStats(templateId) {
  const stats = await prisma.templateReview.groupBy({
    by: ['rating'],
    where: { templateId },
    _count: { rating: true },
  })

  const total = stats.reduce((acc, s) => acc + s._count.rating, 0)
  const sum = stats.reduce((acc, s) => acc + s.rating * s._count.rating, 0)
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  stats.forEach(s => { distribution[s.rating] = s._count.rating })

  return {
    averageRating: total > 0 ? Math.round((sum / total) * 10) / 10 : 0,
    totalReviews: total,
    distribution,
  }
}

export async function createReview(templateId, userId, data) {
  const existing = await prisma.templateReview.findUnique({
    where: { templateId_userId: { templateId, userId } },
  })
  if (existing) throw new AppError('لقد قيمت هذا القالب مسبقاً', 409, 'REVIEW_EXISTS')

  const template = await prisma.template.findUnique({ where: { id: templateId }, select: { id: true } })
  if (!template) throw new AppError('القالب غير موجود', 404, 'TEMPLATE_NOT_FOUND')

  return prisma.templateReview.create({
    data: { templateId, userId, ...data },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
  })
}

export async function deleteReview(id, userId) {
  const review = await prisma.templateReview.findUnique({
    where: { id },
    select: { id: true, userId: true },
  })
  if (!review) throw new AppError('التقييم غير موجود', 404, 'REVIEW_NOT_FOUND')
  if (review.userId !== userId) throw new AppError('ليس لديك صلاحية', 403, 'FORBIDDEN')

  await prisma.templateReview.delete({ where: { id } })
}
