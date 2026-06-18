import { success, created, paginated } from '../../lib/response.js'
import * as versionsService from './versions.service.js'
import { getPagination } from '../../lib/pagination.js'

export async function list(req, res, next) {
  try {
    const { page, limit } = getPagination(req.query)
    const result = await versionsService.getVersions(req.params.templateId, page, limit)
    paginated(res, result.versions, result.total, result.page, limit)
  } catch (err) { next(err) }
}

export async function getById(req, res, next) {
  try {
    const version = await versionsService.getVersion(req.params.id)
    success(res, version)
  } catch (err) { next(err) }
}

export async function create(req, res, next) {
  try {
    const version = await versionsService.createVersion(req.params.templateId, req.validatedData)
    created(res, version)
  } catch (err) { next(err) }
}

export async function setCurrent(req, res, next) {
  try {
    const version = await versionsService.setCurrentVersion(req.params.id, req.params.templateId)
    success(res, version)
  } catch (err) { next(err) }
}

export async function remove(req, res, next) {
  try {
    await versionsService.deleteVersion(req.params.id)
    success(res, null, 'تم حذف الإصدار')
  } catch (err) { next(err) }
}
