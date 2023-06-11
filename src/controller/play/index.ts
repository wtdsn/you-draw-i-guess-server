// 发起连接，即进入房间
// 再一次校验房间可加入

import join from './join'
import chat from './chat'
import draw from './draw'
import leave from './leave'
import startGame from './startGame'

// 声明
import { Connect } from '@src/utils/socket-h'
import { chooseKeyWord } from './choose'

interface bodyInter {
  type: "join" | "chat" | "draw" | 'start' | 'choose',
  data?: any
}

export function game(msg: string, connect: Connect) {
  let body: bodyInter
  try {
    body = JSON.parse(msg) as bodyInter
    switch (body.type) {
      case 'chat':
        return chat(body.data, connect)
      case 'draw':
        return draw(body.data, connect)
      case 'choose':
        return chooseKeyWord(body.data, connect)
      case 'join':
        return join(body.data, connect)
      case 'start':
        return startGame(connect)
      default:
        throw Error('参数错误')
    }
  } catch (err: any) {
    connect.send({
      code: 0,
      msg: err.message || "参数错误"
    })
  }
}

export function leaveRoom(connect: Connect) {
  if (connect?.store?.roomNumber) {
    leave(connect.store.roomNumber, connect.store.uid)
  }
}