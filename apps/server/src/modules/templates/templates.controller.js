import * as templatesService from './templates.service.js'
import { getPagination } from '../../lib/pagination.js'
import { toPublicUrl } from '../../middleware/upload.js'

export async function listPublished(req, res, next) {
  try {
    const { page, limit } = getPagination(req.query)
    const result = await templatesService.getPublishedTemplates({
      category: req.query.category,
      search: req.query.search,
      sort: req.query.sort,
      page,
      limit
    })
    res.json(result)
  } catch (err) { next(err) }
}

export async function getById(req, res, next) {
  try {
    const template = await templatesService.getTemplateById(req.params.id)
    res.json(template)
  } catch (err) { next(err) }
}

export async function getPreview(req, res, next) {
  try {
    const template = await templatesService.getTemplateForPreview(req.params.id)
    res.json(template)
  } catch (err) { next(err) }
}

export async function adminGetById(req, res, next) {
  try {
    const template = await templatesService.getTemplateById(req.params.id)
    res.json(template)
  } catch (err) { next(err) }
}

export async function adminList(req, res, next) {
  try {
    const { page, limit } = getPagination(req.query)
    const result = await templatesService.getAllTemplates({ page, limit })
    res.json(result)
  } catch (err) { next(err) }
}

export async function create(req, res, next) {
  try {
    const previewUrl = toPublicUrl(req.file?.path)
    const template = await templatesService.createTemplate(req.validatedData, previewUrl)
    res.status(201).json(template)
  } catch (err) { next(err) }
}

export async function update(req, res, next) {
  try {
    const previewUrl = toPublicUrl(req.file?.path) || null
    const template = await templatesService.updateTemplate(req.params.id, req.validatedData, previewUrl)
    res.json(template)
  } catch (err) { next(err) }
}

export async function remove(req, res, next) {
  try {
    await templatesService.deleteTemplate(req.params.id)
    res.json({ message: 'تم حذف القالب بنجاح' })
  } catch (err) { next(err) }
}

export async function publish(req, res, next) {
  try {
    const template = await templatesService.togglePublish(req.params.id)
    res.json(template)
  } catch (err) { next(err) }
}
