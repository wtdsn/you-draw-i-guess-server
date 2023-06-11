const Server = require('./Server')

exports.createServer = function (cb) {
  return new Server(cb)
}