function createUni(key: string = ''): string {
  let res = Date.now()
  return key + res + Math.round(Math.random() * 100)
}

export default createUni