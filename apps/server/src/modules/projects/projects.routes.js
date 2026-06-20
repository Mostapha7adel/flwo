import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { updateProjectConfigSchema, updateProjectUrlSchema } from './projects.schema.js'
import * as ctrl from './projects.controller.js'

const router = Router()

router.use(authenticate)

router.get('/:orderId/project', ctrl.get)
router.post('/:orderId/project', ctrl.create)
router.put('/:orderId/project/config', validate(updateProjectConfigSchema), ctrl.updateConfig)
router.put('/:orderId/project/urls', validate(updateProjectUrlSchema), ctrl.updateUrls)
router.get('/:orderId/project/source', ctrl.downloadSource)
router.get('/:orderId/project/check-update', ctrl.checkUpdate)
router.post('/:orderId/project/apply-update', ctrl.applyUpdate)
router.get('/:orderId/project/preview-url', ctrl.getPreviewUrl)

export default router
