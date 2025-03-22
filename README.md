# 国际象棋局面分析应用

这是一个基于React Native的国际象棋局面分析应用，可以帮助棋手分析棋局，获取最佳走法和评分。

## 功能特点

- 交互式棋盘界面
- 局面分析和评估
- 最佳走法推荐
- 棋子吃子显示
- 棋盘方向切换
- 走子历史记录

## 安装步骤

### 前提条件

- Node.js (v14.0.0或更高版本)
- npm或yarn
- React Native环境

### 一键安装依赖

```bash
# 使用npm
npm install

# 或使用yarn
yarn install

# 启动Metro服务器
npm start

# 在iOS模拟器上运行
npm run ios

# 在Android模拟器上运行
npm run android

src/
├── components/       # 组件目录
│   ├── Chessboard.tsx       # 棋盘组件
│   └── CapturedPieces.tsx   # 被吃棋子显示组件
├── screens/          # 页面目录
│   ├── HomeScreen.tsx       # 主页面
│   └── AnalyseScreen.tsx    # 分析页面
├── services/         # 服务目录
│   └── api.ts               # API服务
└── assets/           # 资源目录
    └── pieces/              # 棋子图片


