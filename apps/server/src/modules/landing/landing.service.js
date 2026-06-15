import { prisma } from '../../config/database.js'
import { safeRedis } from '../../config/redis.js'
import { CACHE_TTL, CACHE_PREFIX, LANDING_SECTIONS } from '../../lib/constants.js'

export async function getAllSections() {
  const cacheKey = CACHE_PREFIX.LANDING('all')
  const cached = await safeRedis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  const rows = await prisma.landingContent.findMany()
  const result = Object.fromEntries(rows.map(r => [r.section, r.content]))

  await safeRedis.setex(cacheKey, CACHE_TTL.LANDING, JSON.stringify(result))
  return result
}

export async function getSectionContent(section) {
  const cacheKey = CACHE_PREFIX.LANDING(section)
  const cached = await safeRedis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  const row = await prisma.landingContent.findUnique({ where: { section } })
  if (!row) return null

  await safeRedis.setex(cacheKey, CACHE_TTL.LANDING, JSON.stringify(row.content))
  return row.content
}

export async function updateSection(section, content) {
  const row = await prisma.landingContent.upsert({
    where: { section },
    update: { content },
    create: { section, content },
  })

  await safeRedis.del(CACHE_PREFIX.LANDING(section))
  await safeRedis.del(CACHE_PREFIX.LANDING('all'))

  return row
}
