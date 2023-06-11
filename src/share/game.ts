export enum statusE {
  // 未开始
  waitingJoin,
  waitingStart,
  // 0 1 未开始

  // 开始
  newRound,  // 新回合
  choosing, // 选择中
  drawing,  // 绘画中
  roundEnd, // 当前回合结束 （全部答对，部分答对,没有人答对，计算分数）

  end  // 游戏结束
}