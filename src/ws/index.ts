import { createServer } from '@src/utils/socket-h'
import { Server } from '@src/utils/socket-h'

import { game, leaveRoom } from '@src/controller/play'
const createWsServer: () => Server = function () {
	const server = createServer((connect) => {
		connect.on('connect', (socket) => {
			console.log('connect success!')
		})

		connect.on('/game', game)

		connect.on('error', (err) => {
			console.log('ws err', err)
			if (connect.status !== 3 && connect.status !== 4) {
				connect.send({
					code: 0,
					msg: '服务器出错'
				})
			}
		})

		connect.on('close', () => {
			console.log('close', connect.store)
			leaveRoom(connect)
		})
	})

	return server
}

export default createWsServer