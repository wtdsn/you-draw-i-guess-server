import { findRoom } from '@src/db/game'
import { chatInInter } from './Room';
// 声明
import { Connect } from "@src/utils/socket-h";

export default function chat(body: chatInInter, connect: Connect
) {
  const { name, msg, uid } = body
  if (!name || !msg || !uid) {
    connect.send({
      code: 0,
      msg: "参数错误"
    })
    return
  }

  const room = findRoom(connect.store.roomNumber)

  if (!room) {
    throw Error('房间不存在')
  } else {
    room.chat(body)
  }
}