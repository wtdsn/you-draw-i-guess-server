const net = require('net')
const Connect = require('./Connect')
class Server {
  constructor(onConnect) {
    this.connectList = []

    this.server = net.createServer(undefined, (socket) => {
      let connect = new Connect(socket)
      onConnect(connect)
      connect.on('close', () => {
        this.connectList.splice(this.connectList.indexOf(connect), 1)
      })
      this.connectList.push(connect)
    })
  }

  listen(prot, cb) {
    this.server.listen(prot)
    cb && cb(prot)
  }
}

module.exports = Server