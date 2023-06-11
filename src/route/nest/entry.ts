import Router from '@koa/router'
import create from '@src/controller/entry/create'
import { joinByNumber } from '@src/controller/entry/join'

const router = new Router({
  prefix: '/entry'
})

router.post('/create', create)

router.post('/joinByNumber', joinByNumber)

export default router