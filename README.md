# 🎹 钢琴网站

基于 Vue 3 + TypeScript 开发的移动端钢琴演奏网站，支持 88 键全键盘演奏。

## 功能特性

- 🎹 **88 键完整钢琴键盘** - 包含 52 个白键和 36 个黑键，按标准钢琴排列
- 🎵 **移调功能** - 支持 ±12 半音移调，满足移调练习需求
- 📱 **横竖屏适配** - 自动适配横屏和竖屏，横屏展示完整键盘，竖屏支持滚动
- 🗺️ **底部缩略图导航** - 快速定位和跳转键盘区域
- ✋ **触摸优化** - 支持多点触控，支持滑动连续演奏
- 🔊 **Web Audio API 合成** - 无需加载音频文件，实时合成钢琴音色
- ⌨️ **键盘支持** - 支持电脑键盘演奏 (Z-M 行和 Q-P 行)

## 技术栈

- **框架**: Vue 3 (Composition API)
- **语言**: TypeScript
- **构建工具**: Vite
- **音频**: Web Audio API
- **样式**: Scoped CSS

## 项目结构

```
src/
├── components/          # Vue 组件
│   ├── ControlPanel.vue    # 控制面板（移调等）
│   ├── PianoKeyboard.vue   # 钢琴键盘
│   └── PianoThumbnail.vue  # 底部缩略图导航
├── composables/         # 组合式函数
│   ├── useAudio.ts         # 音频管理
│   ├── useKeyboard.ts      # 键盘交互
│   └── useScreen.ts        # 屏幕适配
├── types/               # TypeScript 类型定义
│   └── piano.ts
├── utils/               # 工具函数
│   ├── audio.ts            # 音频合成器
│   └── piano.ts            # 钢琴数据生成
├── App.vue              # 主应用组件
└── main.ts              # 入口文件
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 构建

```bash
npm run build
```

构建产物位于 `dist` 目录。

## 使用说明

### 触摸操作

- **单点触摸**: 点击琴键发声
- **滑动演奏**: 手指在键盘上滑动，依次触发经过的琴键
- **多点触控**: 支持多个手指同时按下不同琴键
- **缩略图导航**: 点击或拖拽底部缩略图，快速跳转到指定位置

### 移调功能

- 点击顶部的 `-1` / `+1` 按钮进行移调
- 移调范围: -12 到 +12 半音
- 移调后所有琴键音高整体偏移

### 电脑键盘

支持使用电脑键盘演奏（以下对应钢琴的 C3-B4 区域）：

```
键盘: 2 3   5 6 7   9 0
音符: C# D#  F# G# A#  C# D#
      Q W E R T Y U I O P
      C D E F G A B C D E F

      S D   G H J   L ;
      C# D#  F# G# A#  C# D#
      Z X C V B N M , . /
      C D E F G A B C D E F
```

## 浏览器兼容性

- iOS Safari 12+
- Chrome 80+
- Android Chrome 80+
- 微信内置浏览器

## 注意事项

1. **音频激活**: 首次访问时需要点击页面任意位置激活音频（浏览器自动播放策略限制）
2. **移动端**: 建议在横屏模式下使用以获得最佳体验
3. **性能**: 快速滑动演奏时，低端设备可能会出现轻微延迟

## 许可证

MIT License
