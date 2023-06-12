# syntax=docker/dockerfile:1

# 项目相关
FROM node:18.16-alpine
RUN npm install -g pnpm
# 指定工作目录
WORKDIR /app
# 移动项目
COPY . .

# 在工作目录中执行，根目录可能有问题
RUN pnpm install
RUN pnpm run build
# RUN npm run serve
CMD ["node","./dist/app.js"]