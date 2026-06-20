import { prisma } from '../../config/database.js'
import { safeRedis } from '../../config/redis.js'
import { AppError } from '../../lib/AppError.js'
import { CACHE_TTL, CACHE_PREFIX } from '../../lib/constants.js'

export async function getPublishedTemplates({ category, search, sort, page = 1, limit = 12 }) {
  const cacheKey = CACHE_PREFIX.TEMPLATE_LIST({ category, search, sort, page, limit })

  const cached = await safeRedis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  const where = {
    isPublished: true,
    ...(category && category !== 'all' && { category }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    })
  }

  const orderBy = sort === 'price_asc' ? [{ price: 'asc' }]
    : sort === 'price_desc' ? [{ price: 'desc' }]
    : sort === 'popular' ? [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
    : [{ sortOrder: 'asc' }, { createdAt: 'desc' }]

  const [templates, total] = await Promise.all([
    prisma.template.findMany({
      where,
      select: {
        id: true, title: true, description: true, category: true,
        price: true, previewUrl: true, tags: true, defaultColors: true
      },
      orderBy,
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.template.count({ where })
  ])

  const result = { templates, total, page, totalPages: Math.ceil(total / limit) }
  await safeRedis.setex(cacheKey, CACHE_TTL.TEMPLATE_LIST, JSON.stringify(result))
  return result
}

export async function getTemplateById(id) {
  const cacheKey = CACHE_PREFIX.TEMPLATE(id)
  const cached = await safeRedis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  const template = await prisma.template.findUnique({
    where: { id },
    select: {
      id: true, title: true, description: true, category: true,
      price: true, previewUrl: true, demoUrl: true, tags: true,
      defaultColors: true, components: true, isPublished: true
    }
  })

  if (!template) throw new AppError('القالب غير موجود', 404, 'TEMPLATE_NOT_FOUND')

  await safeRedis.setex(cacheKey, CACHE_TTL.TEMPLATE, JSON.stringify(template))
  return template
}

export async function getTemplateForPreview(id) {
  const template = await prisma.template.findUnique({
    where: { id, isPublished: true },
    select: {
      id: true, title: true, description: true, category: true,
      price: true, previewUrl: true, demoUrl: true, tags: true,
      defaultColors: true, components: true
    }
  })
  if (!template) throw new AppError('القالب غير موجود', 404, 'TEMPLATE_NOT_FOUND')
  return template
}

export async function getAllTemplates({ page = 1, limit = 20 }) {
  const [templates, total] = await Promise.all([
    prisma.template.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.template.count()
  ])
  return { templates, total, page, totalPages: Math.ceil(total / limit) }
}

export async function createTemplate(data, previewUrl, sourceFile) {
  const { manifest, ...rest } = data
  const template = await prisma.template.create({
    data: {
      ...rest,
      previewUrl,
      sourceFile: sourceFile || undefined,
      price: parseFloat(data.price),
    }
  })
  await invalidateCache()
  return template
}

export async function updateTemplate(id, data, previewUrl, sourceFile) {
  const { manifest, ...rest } = data
  const updateData = { ...rest }
  if (previewUrl) updateData.previewUrl = previewUrl
  if (sourceFile) updateData.sourceFile = sourceFile

  const template = await prisma.template.update({
    where: { id },
    data: updateData,
  })
  await invalidateCache(id)
  return template
}

export async function deleteTemplate(id) {
  await prisma.template.delete({ where: { id } })
  await invalidateCache(id)
}

export async function togglePublish(id) {
  const template = await prisma.template.findUnique({ where: { id } })
  if (!template) throw new AppError('القالب غير موجود', 404, 'TEMPLATE_NOT_FOUND')

  const updated = await prisma.template.update({
    where: { id },
    data: { isPublished: !template.isPublished }
  })
  await invalidateCache(id)
  return updated
}

async function invalidateCache(id = null) {
  if (id) await safeRedis.del(CACHE_PREFIX.TEMPLATE(id))
  let cursor = '0'
  const batch = []
  do {
    const result = await safeRedis.scan(cursor, { match: `templates:list:*`, count: 100 })
    if (!result) break
    cursor = result.cursor
    batch.push(...result.keys)
  } while (cursor !== '0')
  if (batch.length > 0) await safeRedis.del(...batch)
}
