import { statusE } from '@src/share/game'
import { Connect } from '@src/utils/socket-h'
import { throttle } from 'utils-h'

const words1 = ['草', '花', '鱼', '水']
const words2 = ['西瓜', '香蕉', '木鱼', '太阳']
const words3 = ['滑雪场', '含羞草', '拖拉机', '肯德基']
const words4 = ['蜜雪冰城', '后羿射日', '女娲补天', '嫦娥奔月']

// 等待时间
const showNewRounTime = 3000
const chooseTime = 12000
const drawTime = 90 * 1000
const roundEndTime = 3000
const gameEndTime = 3000

// 得分标准
const firtRight = 6
const secondRight = 4
const thirdRight = 3
const lastRight = 2

function computedDrawerScore(rightNum: number): number {
	// 规则
	// 按照答对一人给2分。总给分不操过 10 分。
	const score = rightNum * 2
	return score > 10 ? 10 : score
}


// 玩家接口声明
export interface palyerInter {
  uid: string,
  name: string,
  score: number,
  connect: Connect
}

// 接受的聊天信息
export interface chatInInter {
  name: string,
  msg: string,
  uid: string
}

// 发出的聊天信息
interface chatOutInter {
  type: 'chat' | 'right' // chat 即聊天或者错误答案 ， right  即正确答案
  name: string,
  msg: string,
  uid: string
}

// 作画信息
export interface drawInfoInter {
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  tool: string
  color: string
}

// 通知得分消息
interface scoreInfoInter {
  type: 'score',
  data: {
    uid: string,
    addScore: number
  }
}

// 回合类
class Round {
	public rightPalyer: Set<string> = new Set()
	public rightNum = 0
	public wordsList: string[] = []
	public keyword = ''
	public chooseTimer: any
	constructor(public drawerId: string) {
	}

	getWordsList() {
		this.wordsList = _getKeyWords()
		return this.wordsList
	}

	setKeyWord(word: string) {
		this.wordsList = []
		this.keyword = word
		clearTimeout(this.chooseTimer)
	}
}

function _getKeyWords() {
	const wordList = []
	wordList.push(words1[Math.round(Math.random() * (words1.length - 1))])
	wordList.push(words2[Math.round(Math.random() * (words2.length - 1))])
	wordList.push(words3[Math.round(Math.random() * (words3.length - 1))])
	wordList.push(words4[Math.round(Math.random() * (words4.length - 1))])
	return wordList
}


// 房间类
export class Room {
	public status: statusE
	public palyers: palyerInter[] = []
	public round: Round | undefined
	public drawerIndex = 0
	public roomOwnerId: string | undefined
	public chatList: chatOutInter[] = []
	public drawInfoList: drawInfoInter[] = []
	public drawTimer: any
	public waitTime = 0

	constructor(public roomNumber: string) {
		this.status = statusE.waitingJoin
	}

	// 有人加入
	joinRoom(palyer: palyerInter) {
		this.palyers.push(palyer)

		if (this.palyers.length === 1) {
			// 第一个进入的是房主
			this.roomOwnerId = palyer.uid
		}


		// 加入成功！
		palyer.connect.send({
			code: 1,
			msg: '加入成功！',
			data: {
				type: 'myJoin',
				data: {
					status: this.status,
					roomOwnerId: this.roomOwnerId,
					myId: palyer.uid
				}
			}
		})

		// 通知人员更新
		this.noticeUpdatePlayers()

		// 进入等待开始状态
		if (this.palyers.length > 1) this.noticeStatusChange(statusE.waitingStart)
	}

	// 有人退出
	leaveRoom(uid: string) {
		console.log('leaveRoom', uid)
		if (this.status < 2) {
			// 未开始
			this.palyers = this.palyers.filter(v => {
				if (v.uid === uid) return false
				return true
			})

			this.noticeUpdatePlayers()

			if (this.palyers.length < 2) {
				this.noticeStatusChange(statusE.waitingJoin)
			}
		} else {
			// 退出的是绘画的
			// 退出的不是绘画的
			// 退出的在绘画的前面  index减一
			// 退出的在绘画人的后面 index 不变
			// 退出的是房主
			// 搞不动，再说
		}
	}

	// 通知有人加入
	noticeUpdatePlayers() {
		const palyers = this.palyers
		const data = JSON.stringify({
			code: 1,
			msg: '成员更新',
			data: {
				type: 'join',
				data: palyers.map(v => {
					return {
						uid: v.uid,
						name: v.name,
						score: v.score
					}
				})
			}
		})

		palyers.forEach(v => {
			v.connect.send(data)
		})
	}

	// 状态改变
	noticeStatusChange(newStatus: statusE) {
		this.status = newStatus
		let data: string
		if (newStatus > 1) {
			// 开始后
			data = JSON.stringify({
				code: 1,
				msg: '房间状态变化',
				data: {
					type: 'status',
					data: {
						status: newStatus,
						roomOwnerId: this.roomOwnerId,
						drawerId: this.palyers[this.drawerIndex].uid,
						waitTime: this.waitTime
					}
				}
			})
		} else {
			// 还没开始
			data = JSON.stringify({
				code: 1,
				msg: '房间状态变化',
				data: {
					type: 'status',
					data: {
						status: newStatus,
						roomOwnerId: this.roomOwnerId
					}
				}
			})
		}


		this.palyers.forEach(v => {
			v.connect.send(data)
		})
	}

	// 点击开始游戏
	startGame() {
		// 重置数据
		if (this.status === statusE.end) {
			this.drawerIndex = 0
			this.palyers.forEach(v => {
				v.score = 0
			})
		}

		if (this.status === statusE.waitingStart || this.status === statusE.end) {
			this.newRound()
			return true
		}
		else {
			return false
		}
	}

	// 选择
	newRound() {
		this.noticeStatusChange(statusE.newRound)
		this.round = undefined
		// 3000 显示新回合开始
		this.waitTime = showNewRounTime
		setTimeout(() => {
			this.noticeChoose()
		}, showNewRounTime)
	}

	// 通知前端发送请求
	noticeChoose() {
		this.noticeStatusChange(statusE.choosing)
		this.round = new Round(this.palyers[this.drawerIndex].uid)

		// 发送词语
		this.palyers[this.drawerIndex].connect.send({
			code: 1,
			msg: '绘画词',
			data: {
				type: 'choosing',
				data: {
					list: this.round!.getWordsList()
				}
			}
		})

		this.waitTime = chooseTime
		this.round.chooseTimer = setTimeout(() => {
			// 如果此时间内没有选择，默认选择第一个
			// todo 考虑其他异常情况呢？比如用户退出，本回合异常结束，进入下一个回合？
			this.setKeyWord(this.round?.wordsList[0] || '花')
		}, chooseTime)
	}

	// 选择完
	setKeyWord(word: string) {
		this.round?.setKeyWord(word)
		// 开始作画
		this.waitTime = drawTime
		this.noticeStatusChange(statusE.drawing)
		this.drawTimer = setTimeout(() => {
    	this.endRound()
		}, drawTime)
	}

	// 接收作画，发送作画
	noticeDraw(infos: drawInfoInter[]) {
		this.drawInfoList.push(...infos)
		flushDrawInfoList(this.palyers, this.drawInfoList, this.drawerIndex)
	}


	// 回合结束
	endRound() {
		// 如果先全部答对
		clearTimeout(this.drawTimer)
		this.waitTime = roundEndTime
		this.noticeStatusChange(statusE.roundEnd)


		// 计算绘画者得分
		const addScore = computedDrawerScore(this.round!.rightNum)
		const palyer = this.palyers[this.drawerIndex++]
		palyer.score += addScore

		const scoreInfo: scoreInfoInter = {
			type: 'score',
			data: {
				uid: palyer.uid,
				addScore: addScore
			}
		}

		// 通知得分
		const scoreInfoStr = JSON.stringify({
			code: 1,
			msg: '得分更新',
			data: scoreInfo
		})

		this.palyers.forEach(v => {
			v.connect.send(scoreInfoStr)
		})

		// 结算一波
		setTimeout(() => {
			// 目前仅考虑每人一回合
			if (this.drawerIndex === this.palyers.length) {
				// 结束游戏
				this.endGame()
				return
			}

			this.newRound()
		}, roundEndTime)
	}

	endGame() {
		this.waitTime = 0
		this.drawerIndex = 0
		// 显示游戏结果
		this.noticeStatusChange(statusE.end)

		// setTimeout(() => {
		// this.noticeStatusChange(statusE.waitingJoin)
		// }, gameEndTime)
	}

	// 聊天
	chat(data: chatInInter) {
		// 绘画中
		const msg = data.msg.trim()

		// 答对了
		if (this.status === statusE.drawing && msg === this.round?.keyword) {
			// 如果之前就答对
			if (this.round.rightPalyer.has(data.uid)) {
				this.chatList.push({
					type: 'chat',
					...data,
					msg: '*'.repeat(this.round.keyword.length)
				})
			} else {
				// 刚答对
				this.chatList.push({
					type: 'right',
					...data,
					msg
				})
				this.round.rightNum++
				let addScore: number
				switch (this.round.rightNum) {
				case 1:
					addScore = firtRight
					break
				case 2:
					addScore = secondRight
					break
				case 3:
					addScore = thirdRight
					break
				default:
					addScore = lastRight
				}

				this.palyers.some(v => {
					if (v.uid === data.uid) {
						v.score += addScore
						return true
					}
					return false
				})

				this.round.rightPalyer.add(data.uid)

				// 特殊处理
				flushChatList(this.palyers, this.chatList, data.uid, addScore)

				// 全部答对
				if (this.round.rightNum === this.palyers.length - 1) {
					this.endRound()
				}
				return
			}
		}
		else {
			// 没有答对或者非答题
			this.chatList.push({
				type: 'chat',
				...data
			})
		}

		noticeChat(this.palyers, this.chatList)
	}
}


const noticeChat = throttle(300, flushChatList, true)

// 发送聊天内容
function flushChatList(palyers: palyerInter[], chatList: chatOutInter[], righterId?: string, addScore?: number) {
	const list = chatList.splice(0)

	if (righterId) {
		// 答对玩家
		const lastChat = list[list.length - 1]
		lastChat.msg = `答案:'${lastChat.msg}'正确！你是第一位答对的！+${addScore}`
		const toWiner = JSON.stringify({
			code: 1,
			msg: '聊天更新',
			data: {
				type: 'chat',
				data: list
			}
		})
		lastChat.msg = `玩家${lastChat.name}回答正确!是第一位答对的玩家`
		const toOther = JSON.stringify({
			code: 1,
			msg: '聊天更新',
			data: {
				type: 'chat',
				data: list
			}
		})

		const scoreInfo: scoreInfoInter = {
			type: 'score',
			data: {
				uid: righterId,
				addScore: addScore!
			}
		}
		const scoreInfoStr = JSON.stringify({
			code: 1,
			msg: '得分更新',
			data: scoreInfo
		})
		palyers.forEach(v => {
			// 通知聊天
			if (v.uid === righterId) {
				v.connect.send(toWiner)
			} else
				v.connect.send(toOther)

			// 通知得分
			v.connect.send(scoreInfoStr)
		})
	} else {
		// 正常
		const data = JSON.stringify({
			code: 1,
			msg: '聊天更新',
			data: {
				type: 'chat',
				data: list
			}
		})

		palyers.forEach(v => {
			v.connect.send(data)
		})
	}
}

// 发送绘画内容
const flushDrawInfoList = throttle(100, function (palyers: palyerInter[], infoLsit: drawInfoInter[], drawerIndex: number) {
	const data = JSON.stringify({
		code: 1,
		msg: '绘画更新',
		data: {
			type: 'draw',
			data: infoLsit.splice(0)
		}
	})

	palyers.forEach((v, i) => {
		if (i !== drawerIndex) {
			v.connect.send(data)
		}
	})
}, true)

export const createRoomNumber: () => string = () => {
	let number = ''
	for (let i = 0; i < 6; i++) {
		number += Math.round(Math.random() * 9)
	}
	return number
}