import { findRoom } from '@src/db/game'

export default function leave(roomNumber: string, uid: string) {
  const room = findRoom(roomNumber)
  if (!room) {
    return
  }
  room.leaveRoom(uid)
}

