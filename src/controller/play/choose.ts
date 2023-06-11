import { findRoom } from '@src/db/game'
import { Connect } from '@src/utils/socket-h'
import { statusE } from '@src/share/game'

export function chooseKeyWord(word: string, connect: Connect) {
	const { uid, roomNumber } = connect.store
	console.log('chooseWord', word)
	// 查找房间
	const room = findRoom(roomNumber)

	if (room?.status !== statusE.choosing || room?.round?.drawerId !== uid) {
		throw Error('请求失败')
	}

  room!.setKeyWord(word)
}