import createUni from '@src/utils/uni'
import { findRoom } from '@src/db/game'

// 声明
import { Connect } from "@src/utils/socket-h";

interface bodyInter {
  name: string,
  roomNumber: string
}

export default function join(body: bodyInter, connect: Connect
) {
  const { name, roomNumber } = body
  if (!name || !roomNumber) {
    throw Error('参数错误')
  }

  const room = findRoom(roomNumber)
  if (!room) {
    connect.send({
      code: 0,
      msg: "该房间不存在"
    })
    connect.close(0, '房间不存在')
  } else if (room.status >= 2) {
    connect.send({
      code: 0,
      msg: "房间游戏中，不可加入"
    })
    connect.close(0, '房间游戏中，不可加入')
  } else {
    let isUniName = room.palyers.every(v => {
      if (v.name === name) return false
      return true
    })

    if (!isUniName) {
      connect.send({
        code: 0,
        msg: `该房间已有昵称为：${name} 的用户，请修改您的昵称`
      })
      connect.close(0, '昵称重复')
    } else {
      // 加入
      console.log("set store")
      let uid = createUni('u')
      connect.store = {
        roomNumber,
        uid
      }

      room.joinRoom({
        uid: uid,
        name,
        score: 0,
        connect
      })
    }
  }
}

