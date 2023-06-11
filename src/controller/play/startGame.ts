import { findRoom } from '@src/db/game'
// 声明
import { Connect } from "@src/utils/socket-h";

export default function startGame(connect: Connect
) {
  const { uid, roomNumber } = connect.store
  const room = findRoom(roomNumber)
  if (!room) {
    throw Error('房间不存在！')
  } else {
    if (room.roomOwnerId !== uid) {
      throw Error('非房主无法开始游戏')
    } else
      if (!room.startGame()) {
        throw Error('无法开始')
      } else
        room.startGame()
  }
}