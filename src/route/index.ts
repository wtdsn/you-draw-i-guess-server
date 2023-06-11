// import chat from './nest/chat'
// import draw from './nest/draw'
import enrty from './nest/entry'
// import game from './nest/index'

import Router from '@koa/router'

const router = new Router()

router
  .use(enrty.routes())
// .use(game.routes())
// .use(draw.routes())


export default router
