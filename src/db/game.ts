import { Room } from "@src/controller/play/Room"

const roomList: Map<string, Room> = new Map()
roomList.set('123456', new Room('123456'))

export function createRoom(
  roomNumber: string,
) {
  let room = new Room(roomNumber)
  roomList.set(roomNumber, room)

  // 5 秒内如果没有加入，清除该房间
  setTimeout(() => {
    if (room.palyers.length < 0) {
      roomList.delete(roomNumber)
    }
  }, 5000)
}

export function findRoom(roomNumber: string): Room | undefined {
  return roomList.get(roomNumber)
}