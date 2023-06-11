import { Socket } from 'net'

interface onInter {
  (eventType: 'connect', cb: (socket: Socket) => any): void
}

interface onInter {
  (eventType: string, cb: (res: string, connect: Connect) => any): void
}

interface onInter {
  (eventType: 'error', cb: (err: Error, connect: Connect) => any): void
}

interface Connect {
  close: (code: number, reason: string) => void
  sendPing: (data: string) => void
  send: (data: string | Object, cb?: Function) => void
  on: onInter,
  store: any,
  status: number
}


interface Server {
  listen: (prot: number, cb?: Function) => void
}

export function createServer(onConnect: (connect: Connect) => void): Server
