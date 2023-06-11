import { findRoom } from '@src/db/game'

export function joinByNumber(ctx: any) {
  const { name, roomNumber } = ctx.request.body
  if (!name || !roomNumber) {
    ctx.throw(400, "参数错误")
    return
  }

  // 查找房间
  const room = findRoom(roomNumber)
  if (!room) {
    ctx.body = {
      code: 0,
      msg: "该房间不存在"
    }
    return
  }

  if (room.status >= 2) {
    ctx.body = {
      code: 0,
      msg: "该房间游戏中！无法加入"
    }
    return
  }

  // 判断用户名是否于房内的用户名重复
  let isUniName = room.palyers.every(v => {
    if (v.name === name) return false
    return true
  })
  if (!isUniName) {
    ctx.body = {
      code: 0,
      msg: `该房间已有昵称为：${name} 的用户，请修改您的昵称`
    }
    return
  }

  // 加入房间
  ctx.body = {
    code: 1,
    msg: "房间可加入！尝试加入！",
    body: room.roomNumber
  }
}


export function joinByRandom(ctx: any) {
  const body = ctx.request.body
  if (!body.name) {
    ctx.throw(400, "参数错误")
    return
  }
}
