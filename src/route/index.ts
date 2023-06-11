
import enrty from './nest/entry'

import Router from '@koa/router'

const router = new Router()

router
	.use(enrty.routes())


export default router
