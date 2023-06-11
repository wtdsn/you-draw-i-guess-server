const { EventEmitter } = require('events')
const { createHash } = require('crypto')
const frame = require('./frame')
const ReadStream = require('./ReadStream')

const CONNECTING = 1
const OPEN = 2
const CLOSING = 3
const CLOSED = 4

class Connect extends EventEmitter {
  constructor(socket) {
    super()
    this.socket = socket
    this.status = CONNECTING
    this.msg = null
    socket.on('readable', () => {
      this._read()
    })

    socket.on('error', () => {
      console.log("err at socket");
      this.status = CLOSING
      this.emit('close')
    })
  }

  _read() {
    let buffer = this.socket.read()
    if (!buffer) return
    if (this.status === CONNECTING) {
      this._open(buffer)
    } else {
      // todo 处理错误
      this._parseFrame(buffer)
    }
  }

  _open(buffer) {
    let { path, headers } = parseShake(buffer.toString())
    this.path = path

    // 没有对应的监听器
    if (this.listeners(path).length < 1) {
      this.socket.end()
      this.emit('close')
      return
    }

    let inkey = headers['Sec-WebSocket-Key'].trim()
    let sha1 = createHash('sha1')
    sha1.end(inkey + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')

    let key = sha1.read().toString('base64')

    let resHeader = {
      Upgrade: 'websocket',
      Connection: 'Upgrade',
      'Sec-WebSocket-Accept': key
    }

    var res = 'HTTP/1.1 101 Switching Protocols\r\n'

    for (let headerName in resHeader) {
      res += headerName + ': ' + resHeader[headerName] + '\r\n'
    }


    this.socket.write(res + '\r\n')

    this.status = OPEN
    this.emit('connect')
  }

  _parseFrame(buffer) {
    let fin, opcode, isMask, start, len, payload

    let b = buffer[0]
    let b1 = b >> 4
    if (b1 % 8) {
      // RSV1-3
      return false
    }

    // 判断 fin
    fin = b1 === 8
    // frame 类型
    opcode = b % 16

    // 0 1 2 8 9 10 是正常的
    if (opcode !== 0 && opcode !== 1 && opcode !== 2 &&
      opcode !== 8 && opcode !== 9 && opcode !== 10) {
      return false
    }
    // 大于 8 的，是控制类的 frame ，fin 应该为 1
    if (opcode >= 8 && !fin) {
      return false
    }

    b = buffer[1]

    // 第一位表示 mask
    isMask = b >> 7

    // 后面 7 位表示 payload 的长度 ， %128 即获取长度
    len = b % 128

    /* 
      如果 mask 存在，在 payload 前面就有一个 masking-key
      此字段长度位 4 个 8 位 ，（4个字节
      原本前面的 fin ,rsv ,cpcode 占用 1一个字节
      mask 和 payload 占用一个字节。因此总共 6 个字节
      因此 buffer[6] 开始才是 payload 的数据
    */
    start = isMask ? 6 : 2

    /* 
       根据 b % 128 ，修改 len 的长度和 start
       当 payload 的长度在 [0,125] ，则使用 7 位标识长度
       当 payload 的长度是 126 , 后 2个 8 位 ，即 buffer[2 & 3] 用于表示长度 （无符号位）
       当 payload 的长度是 127 , 后 8个 8 位 ，即 buffer[2 - 9] 用于表示长度 （无符号位）
    */
    if (len === 126) {
      // readUInt16BE(2) 指定偏移 2 字节，读取 16 位无符号整数
      len = buffer.readUInt16BE(2)
      start += 2
    } else if (len === 127) {
      // 分两部分读取
      len = buffer.readUInt32BE(2) * Math.pow(2, 32) + buffer.readUInt32BE(6)
      start += 8
    }
    payload = buffer.slice(start, start + len)

    if (isMask) {
      // 读取 mask_key
      let mask_key = buffer.slice(start - 4, start)
      // 解析为原本数据
      for (let i = 0; i < payload.length; i++) {
        payload[i] ^= mask_key[i % 4]
      }
    }

    return this._parsePayload(fin, opcode, payload)
  }

  _parsePayload(fin, opcode, payload) {
    debugger
    // 8 为 clode
    if (opcode === 8) {
      // 服务端先 clode 时，会处于 closing 状态，等待客户端响应
      if (this.status === CLOSING) {
        this.socket.end()
      } else if (this.status === OPEN) {
        // 客户端主动 close
        this._processCloseFrame(payload)
      }
      return true
    } else if (opcode === 9) {
      // Ping frame ， 响应 pong frame
      if (this.readyState === this.OPEN) {
        this.socket.write(frame.createPongFrame(payload.toString(), false))
      }
      return true
    } else if (opcode === 10) {
      // Pong frame
      this.emit('pong', payload.toString())
      return true
    }

    // opcode 为 0 表示还有数据 ， 使用 frameBuffer 进行拼接
    // 但第一次时 ， opcode 不会为 0 
    if (opcode === 0 && this.msg === null) {
      return false
    } else if (opcode !== 0 && this.msg !== null) {
      return false
    }

    // 如果 opcode 是 0 ， 根据 msgBuffer 进行判断是 1 还是 2
    let type = opcode || typeof this.msg === 'string' ? 1 : 2
    // 字符串
    if (type === 1) {
      payload = payload.toString()
      this.msg = this.msg ? this.msg + payload : payload

      if (fin) {

        this.emit(this.path, this.msg, this)
        this.msg = null
      }
    } else {
      // 二进制
      if (!this.msg) {
        this.msg = new ReadStream()
        // 把 流对象传递出去 ，通过 data 读取
        this.emit(this.path, this.msg, this)
      }
      this.msg.addData(payload)

      if (fin) {
        // 触发 end 事件
        this.msg.end()
        this.msg = null
      }
    }

    return true
  }

  _processCloseFrame(payload) {
    var code, reason
    if (payload.length >= 2) {
      code = payload.readUInt16BE(0)
      reason = payload.slice(2).toString()
    } else {
      code = 1005
      reason = ''
    }
    this.socket.write(frame.createCloseFrame(code, reason, false))
    this.status = CLOSED
    this.emit('close', code, reason)
  }

  close(code, reason) {
    if (this.status === OPEN) {
      // 发起 close , 等待响应
      this.socket.write(frame.createCloseFrame(code, reason, !this.socket))
      this.status = CLOSING
    } else if (this.status !== CLOSED) {
      this.socket.end()
      this.status = this.CLOSED
    }
    this.emit('close', code, reason)
  }

  sendPing = function (data) {
    if (this.status === OPEN) {
      this.socket.write(frame.createPingFrame(data || '', !this.socket))
    } else {
      this.emit('error', new Error('You can\'t write to a non-open connection'))
    }
  }

  send(data, cb) {
    if (Buffer.isBuffer(data)) {
      this.sendBinary(data, cb)
      return
    }
    if (typeof data === 'string') {
      this.sendText(data, cb)
    } else if (typeof data === 'object') {
      this.sendText(JSON.stringify(data), cb)
    } else {
      throw new TypeError('data should be either a string or a Buffer instance')
    }
  }

  sendText(str, callback) {
    if (this.status === OPEN) {
      return this.socket.write(frame.createTextFrame(str, false), callback)
    } else {
      this.emit('error', new Error('socket 未处于连接状态'))
    }
  }

  sendBinary(data, callback) {
    if (this.status === OPEN) {
      return this.socket.write(frame.createBinaryFrame(data, false, true, true), callback)
    } else {
      this.emit('error', new Error('socket 未处于连接状态'))
    }
  }
}

let eventOn = Connect.prototype.on
Connect.prototype.on = function (eventType, cb) {
  function cbwrapper(...args) {
    try {
      cb.call(this, ...args)
    } catch (error) {
      this.emit('error', error)
    }
  }
  eventOn.call(this, eventType, cbwrapper)
}

let parseShake = function (lines) {
  let path = '/'
  let headers = {}
  let tokens = lines.split('\n')

  path = tokens[0].split(/\s/)[1]
  tokens.forEach(v => {
    if (/.+?:.+?/.test(v)) {
      let [key, val] = v.split(':')
      headers[key] = val
    }
  })

  return {
    path,
    headers
  }
}

module.exports = Connect