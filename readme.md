# node 中使用 ts 开发
借助 ts-node 和 nodemon
nodemon 监听 文件变化 ， ts-node 把 ts 文件转成 js 文件执行
需要下载 ts-node 和 nodemon --save
然后修改 package.json 文件的命令
```json
  "scripts": {
    "serve": "node ./dist/app.js",
    "watch": "nodemon ./src/app.ts",
    "build": "tsc"
  },
```

使用 nodemon 执行 ./src/app.ts 。相当于 nodemon app.js 。不过 ts 文件会先使用 ts-node 进行处理，当然还需要其他配置

根目录下增加 nodemon.json 文件
```json
{
  "watch": [
    "./src"
  ],
  "ext": "ts",
  "execMap": {
    "ts": "ts-node"
  }
}
```

watch 表示监听的文件或者目录
ext 表示需要处理的文件的扩展名
execMap 表示扩展名对应的处理器，即 ts 文件使用 ts-node 进行处理

提供此过程，会把相关的 ts 转换成 js 。然后交给 node 进行处理

# 解决模块问题
当使用路径别名时，需要在 tsconfig.json 中增加
```json
    "baseUrl": "./",
    "paths": {
      "@src/*": [
        "src/*"
      ]
    },
```

但是， typescript , ts-node , nodemon 都不会处理别名
也就是配置后，vscode 可以识别，能够找到模块 ，ts 也可以找到模块
但是在加载时，并不会处理别名。在 webpack 和 vite 中，它们会提供处理别名的功能。

在 node 中，可以使用 tsconfig-paths 包进行处理。
https://github.com/dividab/tsconfig-paths

在此项目中，只需要做简答的修改就行 , (nodemon.json)
```json
 "execMap": {
    "ts": "ts-node -r tsconfig-paths/register"
  }
```


# 使用 js 文件
项目中，使用了一些 js 的文件，ts 如果引用 js 的话，是会报错的，需要给它编写声明文件。
并且， js 文件如果使用模块，使用 commonjs 模块就行了。因为 ts-node 帮我们处理 ts.
js 还是 node 本身去加载，那么就使用 commonjs 进行模块划分。

# 扩展第三方模块的声明
要扩展第三方库的类型，您可以使用 TypeScript 的声明合并功能来添加或更改现有的类型定义。

假设您要扩展的是名为axios的第三方库，您可以创建一个与其相同名称的新文件 axios.d.ts，并在其中声明以下内容：
```typescript
import { AxiosRequestConfig } from 'axios'; // 导入现有的类型定义

declare module 'axios' {
  // 扩展AxiosRequestConfig接口
  interface AxiosRequestConfig {
    timeout: number;
  }
}
```
现在，当您在代码中使用axios时，它应该包含您扩展的新属性timeout。

我扩展的是自己的模块。因此模块名就写引入的路径名。 ts 能识别就行

ts 和 vscode 识别成功了。不过 ts-nde 好像报错了！

不知道怎么办了，只好直接修改原本的声明文件了！