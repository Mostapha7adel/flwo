import { Router } from 'express'
import * as ctrl from './landing.controller.js'

const router = Router()

router.get('/home', ctrl.getHome)
router.get('/content', ctrl.getContent)
router.get('/categories', ctrl.getCategories)
router.get('/all', ctrl.getContent)

export default router
