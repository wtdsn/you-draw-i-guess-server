import { findRoom } from '@src/db/game'
// 声明
import { Connect } from "@src/utils/socket-h";
import { drawInfoInter } from './Room';
export default function draw(body: drawInfoInter[], connect: Connect
) {
  const room = findRoom(connect.store.roomNumber)
  if (!room || room.palyers[room.drawerIndex].uid !== connect.store.uid) {
    throw Error('请求失败')
  } else {
    room.noticeDraw(body)
  }
}