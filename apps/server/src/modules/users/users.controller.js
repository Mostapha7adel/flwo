import { success } from '../../lib/response.js'
import * as usersService from './users.service.js'
import { toPublicUrl } from '../../middleware/upload.js'

export async function updateProfile(req, res, next) {
  try {
    const avatarUrl = toPublicUrl(req.file?.path) || null
    const user = await usersService.updateProfile(req.user.id, req.validatedData, avatarUrl)
    success(res, { user })
  } catch (err) { next(err) }
}

export async function getProfile(req, res, next) {
  try {
    const user = await usersService.getUserById(req.user.id)
    success(res, { user })
  } catch (err) { next(err) }
}
