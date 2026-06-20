import { success, created } from '../../lib/response.js'
import * as fieldsService from './fields.service.js'

export async function list(req, res, next) {
  try {
    const fields = await fieldsService.getFields(req.params.templateId)
    success(res, fields)
  } catch (err) { next(err) }
}

export async function create(req, res, next) {
  try {
    const field = await fieldsService.createField(req.params.templateId, req.body)
    created(res, field)
  } catch (err) { next(err) }
}

export async function update(req, res, next) {
  try {
    const field = await fieldsService.updateField(req.params.id, req.body)
    success(res, field)
  } catch (err) { next(err) }
}

export async function remove(req, res, next) {
  try {
    await fieldsService.deleteField(req.params.id)
    success(res, null, 'تم حذف الحقل')
  } catch (err) { next(err) }
}

export async function reorder(req, res, next) {
  try {
    await fieldsService.reorderFields(req.params.templateId, req.body.orderedIds)
    success(res, null, 'تم ترتيب الحقول')
  } catch (err) { next(err) }
}
