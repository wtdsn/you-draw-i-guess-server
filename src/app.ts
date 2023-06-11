import Koa from 'koa'
// import session from 'koa-session'
import router from './route/index'
import koaBody from 'koa-body'
import cors from 'koa2-cors'
// ws
import createWsServer from './ws'

const app = new Koa()

app.on('error', (err) => {
	console.error('server error', err)
})

app.use(koaBody())
app.use(cors())
app
	.use(router.routes())
	.use(router.allowedMethods())
app.listen(9527, () => {
	console.log('app server at :' + 9527)
})

createWsServer().listen(9528, (prot: string) => {
	console.log('ws server at:' + prot)
})