import { success, created } from '../../lib/response.js'
import * as serversService from './servers.service.js'

export async function list(req, res, next) {
  try {
    const servers = await serversService.getUserServers(req.user.id)
    success(res, servers)
  } catch (err) { next(err) }
}

export async function getById(req, res, next) {
  try {
    const server = await serversService.getServer(req.params.id, req.user.id)
    success(res, server)
  } catch (err) { next(err) }
}

export async function create(req, res, next) {
  try {
    const server = await serversService.createServer(req.user.id, req.validatedData)
    created(res, server)
  } catch (err) { next(err) }
}

export async function update(req, res, next) {
  try {
    const server = await serversService.updateServer(req.params.id, req.user.id, req.validatedData)
    success(res, server)
  } catch (err) { next(err) }
}

export async function remove(req, res, next) {
  try {
    await serversService.deleteServer(req.params.id, req.user.id)
    success(res, null, 'تم حذف السيرفر')
  } catch (err) { next(err) }
}
