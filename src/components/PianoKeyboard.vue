<template>
  <div
    ref="keyboardRef"
    class="piano-keyboard"
    :class="{ 'is-landscape': isLandscape }"
    :style="{ width: `${keyboardWidth}px` }"
    @touchstart.prevent="handleTouchStart"
    @touchmove.prevent="handleTouchMove"
    @touchend.prevent="handleTouchEnd"
    @touchcancel.prevent="handleTouchEnd"
  >
    <!-- 白键容器 -->
    <div class="white-keys">
      <div
        v-for="key in whiteKeys"
        :key="key.id"
        class="key white-key"
        :class="{ active: isKeyActive(key.id) }"
        :data-key-id="key.id"
        :style="getWhiteKeyStyle(key)"
      >
        <span v-if="showLabels" class="key-label">{{ key.note }}{{ key.octave }}</span>
      </div>
    </div>

    <!-- 黑键容器 -->
    <div class="black-keys">
      <div
        v-for="key in blackKeys"
        :key="key.id"
        class="key black-key"
        :class="{ active: isKeyActive(key.id) }"
        :data-key-id="key.id"
        :style="getBlackKeyStyle(key)"
      >
        <span v-if="showLabels" class="key-label">{{ key.note }}{{ key.octave }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { PIANO_KEYS } from '../utils/piano'
import type { PianoKey } from '../types/piano'

interface Props {
  whiteKeys: PianoKey[]
  blackKeys: PianoKey[]
  isKeyActive: (keyId: number) => boolean
  isLandscape: boolean
  showLabels?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showLabels: false
})

const emit = defineEmits<{
  (e: 'press', keyId: number, touchId: number): void
  (e: 'release', keyId: number, touchId: number): void
}>()

// 跟踪每个触摸点当前激活的琴键，避免滑动时重复触发
const activeTouchKeys = ref<Map<number, number>>(new Map())

// 原始白键列表（用于黑键位置计算）
const originalWhiteKeys = PIANO_KEYS.filter(k => k.type === 'white')

// 固定的白键宽度（像素）
const WHITE_KEY_WIDTH = 60
const BLACK_KEY_WIDTH = WHITE_KEY_WIDTH * 0.65

// 计算键盘总宽度
const keyboardWidth = computed(() => {
  return props.whiteKeys.length * WHITE_KEY_WIDTH
})

// 获取白键样式
function getWhiteKeyStyle(key: PianoKey) {
  const index = props.whiteKeys.findIndex(k => k.id === key.id)
  return {
    left: `${index * WHITE_KEY_WIDTH}px`,
    width: `${WHITE_KEY_WIDTH}px`
  }
}

// 获取黑键样式
function getBlackKeyStyle(key: PianoKey) {
  const pos = getBlackKeyPosition(key)
  if (!pos) {
    return {
      left: '0px',
      width: `${BLACK_KEY_WIDTH}px`,
      display: 'none'
    }
  }

  return {
    left: `${pos.left}px`,
    width: `${pos.width}px`
  }
}

// 触摸处理
function handleTouchStart(event: TouchEvent) {
  for (let i = 0; i < event.changedTouches.length; i++) {
    const touch = event.changedTouches[i]
    const keyId = getKeyAtPosition(touch.clientX, touch.clientY)
    if (keyId !== undefined) {
      activeTouchKeys.value.set(touch.identifier, keyId)
      emit('press', keyId, touch.identifier)
    }
  }
}

function handleTouchMove(event: TouchEvent) {
  for (let i = 0; i < event.changedTouches.length; i++) {
    const touch = event.changedTouches[i]
    const keyId = getKeyAtPosition(touch.clientX, touch.clientY)

    if (keyId !== undefined) {
      // 只有琴键变化时才触发新事件
      const currentKeyId = activeTouchKeys.value.get(touch.identifier)
      if (currentKeyId !== keyId) {
        activeTouchKeys.value.set(touch.identifier, keyId)
        emit('press', keyId, touch.identifier)
      }
    }
  }
}

function handleTouchEnd(event: TouchEvent) {
  for (let i = 0; i < event.changedTouches.length; i++) {
    const touch = event.changedTouches[i]
    activeTouchKeys.value.delete(touch.identifier)
    emit('release', -1, touch.identifier)
  }
}

// 黑键前面的白键音符映射
const blackKeyPrevWhite: Record<string, string> = {
  'C#': 'C',
  'D#': 'D',
  'F#': 'F',
  'G#': 'G',
  'A#': 'A'
}

// 计算黑键在键盘上的位置（像素）
function getBlackKeyPosition(key: PianoKey): { left: number; width: number } | null {
  // 获取原始琴键数据（基于ID）
  const originalKey = PIANO_KEYS.find(k => k.id === key.id)
  if (!originalKey) return null

  const originalNote = originalKey.note

  // 找到黑键前面的白键（基于原始音符）
  const prevWhiteNote = blackKeyPrevWhite[originalNote]
  if (!prevWhiteNote) return null

  // 查找该白键在原始白键列表中的索引
  const prevWhiteIndex = originalWhiteKeys.findIndex(
    k => k.note === prevWhiteNote && k.octave === originalKey.octave
  )
  if (prevWhiteIndex === -1) return null

  // 黑键中心位于两个白键的交界处（前一个白键的右边界）
  const blackKeyCenter = (prevWhiteIndex + 1) * WHITE_KEY_WIDTH
  const left = blackKeyCenter - BLACK_KEY_WIDTH / 2

  return { left, width: BLACK_KEY_WIDTH }
}

// 获取指定位置的琴键 ID（使用 elementFromPoint 自动处理旋转）
function getKeyAtPosition(clientX: number, clientY: number): number | undefined {
  const element = document.elementFromPoint(clientX, clientY)
  if (!element) return undefined

  // 向上查找最近的琴键元素
  const keyElement = element.closest('[data-key-id]') as HTMLElement | null
  if (keyElement) {
    const keyId = keyElement.getAttribute('data-key-id')
    return keyId ? parseInt(keyId) : undefined
  }

  return undefined
}
</script>

<style scoped>
.piano-keyboard {
  position: relative;
  height: 100%;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}

.white-keys {
  position: absolute;
  inset: 0;
}

.black-keys {
  position: absolute;
  top: 0;
  left: 0;
  height: 50%;
  pointer-events: none;
}

.key {
  position: absolute;
  height: 100%;
  border-radius: 0 0 4px 4px;
  cursor: pointer;
  transition: background-color 0.05s ease;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 8px;
}

.white-key {
  background: linear-gradient(180deg, #f8f8f8 0%, #e8e8e8 100%);
  border: 1px solid #ccc;
  border-bottom: 4px solid #bbb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.white-key.active {
  background: linear-gradient(180deg, #e0e0e0 0%, #d0d0d0 100%);
  border-bottom: 2px solid #999;
  transform: translateY(2px);
}

.black-key {
  background: linear-gradient(180deg, #333 0%, #111 100%);
  border: 1px solid #000;
  border-bottom: 4px solid #000;
  height: 100%;
  z-index: 10;
  pointer-events: auto;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
}

.black-key.active {
  background: linear-gradient(180deg, #444 0%, #222 100%);
  border-bottom: 2px solid #000;
  transform: translateY(2px);
}

.key-label {
  font-size: 12px;
  font-weight: 500;
  color: #666;
  pointer-events: none;
}

.black-key .key-label {
  color: #aaa;
  font-size: 10px;
}
</style>
