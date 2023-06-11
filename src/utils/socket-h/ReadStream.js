// import { Readable } from 'stream'
const Readable = require('stream')

/**
 * @description
 * @class ReadStream
 * @extends {Readable}
 * @event data  end readbale
 */
class ReadStream extends Readable {
  // 需要实现 _read 方法。不过可以没有执行任何行为
  _read() { }
  add(d) {
    this.push(d)
  }
  end() {
    this.push(null)
  }
}

module.exports = ReadStream
// export default ReadStream