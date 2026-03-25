# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 Vue 3 + TypeScript 的移动端钢琴演奏网站，使用 Web Audio API 实时合成钢琴音色。项目包含完整的 88 键钢琴键盘（52 个白键 + 36 个黑键），支持移调、触摸滑动演奏、横竖屏适配和缩略图导航。

**核心功能**：
- 88 键完整钢琴键盘，标准钢琴排列
- ±12 半音移调功能
- 横竖屏自适应布局
- 多点触控和滑动演奏
- Web Audio API 实时音色合成
- 电脑键盘映射支持

## 开发命令

### 常用命令
```bash
npm run dev          # 启动开发服务器 (端口 3000，--host 模式)
npm run build        # 构建生产版本 (vue-tsc + vite build)
npm run preview      # 预览构建产物
npm run lint         # ESLint 检查并自动修复 (.vue,.ts,.tsx 文件)
npm run format       # Prettier 格式化所有文件
```

### 技术栈
- **框架**: Vue 3 (Composition API)
- **语言**: TypeScript
- **构建工具**: Vite
- **音频**: Web Audio API
- **样式**: Scoped CSS

## 架构概览

### 核心模块

#### 1. 组合式函数 (composables/)
- `useAudio.ts`: 音频状态管理，移调控制
- `useScreen.ts`: 屏幕方向检测和尺寸管理
- `useKeyboard.ts`: 琴键交互逻辑，触摸点跟踪

#### 2. 工具函数 (utils/)
- `audio.ts`: `PianoSynthesizer` 类 - Web Audio API 合成器
  - 使用振荡器生成基波+泛音模拟钢琴音色
  - 自动清理和资源管理
  - 单例实例 `pianoSynth` 供全局使用
- `piano.ts`: 钢琴数据生成和计算工具
  - `PIANO_KEYS`: 88 键静态数据 (MIDI 21-108)
  - 白键/黑键过滤、频率计算、移调计算

#### 3. 组件结构 (components/)
- `App.vue`: 主容器，协调所有组件和状态
- `PianoKeyboard.vue`: 钢琴键盘渲染和触摸处理
- `ControlPanel.vue`: 移调控制和音频状态提示
- `PianoThumbnail.vue`: 底部缩略图导航和视口指示器

#### 4. 类型定义 (types/piano.ts)
- `PianoKey`: 琴键数据结构 (id, note, octave, type, midiNote, frequency)
- `AudioState`: 音频上下文状态 (isInitialized, transpose)
- `ActiveKey`: 激活琴键跟踪 (keyId, touchId)

### 数据流

```
用户交互 → PianoKeyboard组件 → useKeyboard组合式函数
      ↓
useAudio状态更新 → pianoSynth播放声音
      ↓
App.vue协调视图更新和屏幕适配
```

### 触摸处理机制
1. `PianoKeyboard.vue` 处理原始触摸事件
2. `useKeyboard.ts` 管理 `activeKeys` 状态数组
3. 支持多点触控：每个触摸点有唯一 `touchId`
4. 滑动演奏：触摸移动时检测琴键变化，自动触发新音符

### 音频系统
- **延迟初始化**: 首次点击页面激活音频上下文（浏览器策略）
- **移调实现**: 通过频率乘以 2^(transpose/12) 计算
- **音色合成**: 基波 + 5个泛音，混合不同波形（triangle/sine/sawtooth）
- **包络控制**: 攻击、衰减、释音阶段模拟钢琴音色衰减特性

## 关键实现细节

### 琴键定位算法
- 白键：固定宽度 60px，按索引线性排列
- 黑键：根据前一个白键位置计算中心偏移
- 触摸检测：优先检测黑键区域（顶部50%），再检测白键

### 滚动和视口同步
- `App.vue` 中的 `viewportStart/End` 表示可见区域比例 (0-1)
- 键盘滚动 ↔ 缩略图指示器双向同步
- 公式：`scrollRatio = viewportStart / (1 - viewportSize)`

### 电脑键盘映射
- 两排键盘映射到 C3-B4 区域
- Z-M 行：C3-F4，S/D/G/H/J/L 为黑键
- Q-P 行：C4-F5，2/3/5/6/7/9/0 为黑键

## 开发注意事项

### 音频上下文限制
- **自动播放策略**: 必须在用户手势后初始化音频，`App.vue` 中的 `handleActivateAudio` 处理此逻辑
- **资源清理**: 组件卸载时调用 `pianoSynth.stopAll()` 防止内存泄漏

### 性能考虑
- 快速滑动时可能触发大量音频节点，合成器有自动停止和清理机制
- 使用 `console.log` 调试音频状态（生产环境可移除）

### 样式约定
- 使用 Scoped CSS 避免样式冲突
- 横竖屏样式通过 `.is-landscape`/`.is-portrait` 类名控制
- 琴键激活状态通过 `.active` 类名和样式变化体现

### 类型安全
- 所有函数和组件都有完整的 TypeScript 类型定义
- 使用 `types/piano.ts` 中的类型确保数据一致性

## 扩展建议

### 添加新功能
1. **音色选择**: 扩展 `PianoSynthesizer` 支持不同乐器波形
2. **录音功能**: 在 `useKeyboard` 中记录音符序列
3. **节拍器**: 创建独立的 `useMetronome` 组合式函数
4. **和弦提示**: 在 `PianoKeyboard` 中高亮显示和弦音符

### 代码结构优化
- 保持组合式函数的单一职责原则
- 工具函数应纯函数化，避免副作用
- 组件只负责渲染和用户交互，业务逻辑放在组合式函数中