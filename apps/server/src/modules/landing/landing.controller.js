import { success } from '../../lib/response.js'
import { prisma } from '../../config/database.js'
import * as landingService from './landing.service.js'

export async function getHome(req, res, next) {
  try {
    const [featuredTemplates, templatesCount, clientsCount, projectsCount] = await Promise.all([
      prisma.template.findMany({
        where: { isPublished: true },
        select: { id: true, title: true, description: true, category: true, price: true, previewUrl: true },
        orderBy: { sortOrder: 'asc' },
        take: 8
      }),
      prisma.template.count({ where: { isPublished: true } }),
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.order.count(),
    ])
    success(res, {
      featuredTemplates,
      stats: { templates: templatesCount, clients: clientsCount, projects: projectsCount }
    })
  } catch (err) { next(err) }
}

export async function getContent(req, res, next) {
  try {
    const data = await landingService.getAllSections()
    success(res, data)
  } catch (err) { next(err) }
}

export async function getCategories(req, res, next) {
  try {
    const categories = await prisma.template.groupBy({
      by: ['category'],
      _count: true,
      where: { isPublished: true }
    })
    success(res, {
      categories: categories.map(c => ({ name: c.category, count: c._count }))
    })
  } catch (err) { next(err) }
}
