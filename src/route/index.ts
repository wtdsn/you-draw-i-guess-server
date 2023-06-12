
import enrty from './nest/entry'

import Router from '@koa/router'

const router = new Router()

router
	.use(enrty.routes())

router.get('/get-app-name',(ctx)=>{
	ctx.body = 'you-draw-i-guess' + ' v1.0.0 ' + Date.now()
})


export default router
