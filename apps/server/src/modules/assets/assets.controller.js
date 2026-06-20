import { success, created } from '../../lib/response.js'
import * as assetsService from './assets.service.js'

export async function list(req, res, next) {
  try {
    const assets = await assetsService.getAssets(req.params.templateId, req.query.type)
    success(res, assets)
  } catch (err) { next(err) }
}

export async function create(req, res, next) {
  try {
    const asset = await assetsService.createAsset(req.params.templateId, req.body)
    created(res, asset)
  } catch (err) { next(err) }
}

export async function remove(req, res, next) {
  try {
    await assetsService.deleteAsset(req.params.id)
    success(res, null, 'تم حذف الأصل')
  } catch (err) { next(err) }
}
