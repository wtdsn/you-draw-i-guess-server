import { createRoom, findRoom } from '@src/db/game'
import { createRoomNumber } from '../play/Room'

function create(ctx: any) {
  const { name } = ctx.request.body

  if (!name) {
    // ctx.throw(400, "昵称不能为空")
    ctx.status = 400
    ctx.body = "昵称不能为空"
    return
  }

  // 创建房间
  let roomNumber = createRoomNumber()
  let maxRetry = 3
  while (maxRetry && findRoom(roomNumber)) {
    maxRetry--
    roomNumber = createRoomNumber()
  }
  if (!maxRetry) {
    ctx.body = {
      code: 0,
      msg: "创建失败"
    }
    return
  }

  createRoom(roomNumber)

  ctx.body = {
    code: 1,
    msg: "创建成功！",
    data: roomNumber
  }
}

export default create