import * as ordersService from './orders.service.js'
import { getPagination } from '../../lib/pagination.js'

export async function create(req, res, next) {
  try {
    const order = await ordersService.createOrder(req.user.id, req.validatedData)
    res.status(201).json(order)
  } catch (err) { next(err) }
}

export async function list(req, res, next) {
  try {
    const { page, limit } = getPagination(req.query)
    const result = await ordersService.getUserOrders(req.user.id, { page, limit })
    res.json(result)
  } catch (err) { next(err) }
}

export async function getById(req, res, next) {
  try {
    const order = await ordersService.getOrderById(req.params.id, req.user.id)
    res.json(order)
  } catch (err) { next(err) }
}

export async function cancel(req, res, next) {
  try {
    const order = await ordersService.cancelOrder(req.params.id, req.user.id)
    res.json(order)
  } catch (err) { next(err) }
}
