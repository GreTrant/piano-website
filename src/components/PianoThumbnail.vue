<template>
  <div
    ref="thumbnailRef"
    class="piano-thumbnail"
    @touchstart.prevent="handleTouchStart"
    @touchmove.prevent="handleTouchMove"
    @touchend.prevent="handleTouchEnd"
    @click="handleClick"
  >
    <!-- 琴键缩略图 -->
    <div class="thumbnail-keys">
      <div
        v-for="key in allKeys"
        :key="key.id"
        class="thumb-key"
        :class="{ 'is-black': key.type === 'black' }"
        :style="getThumbKeyStyle(key)"
      />
    </div>

    <!-- 当前视口指示器 -->
    <div
      class="viewport-indicator"
      :style="indicatorStyle"
      @touchstart.stop.prevent="handleIndicatorStart"
      @touchmove.stop.prevent="handleIndicatorMove"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { PIANO_KEYS, WHITE_KEY_COUNT } from '../utils/piano'
import type { PianoKey } from '../types/piano'

interface Props {
  viewportStart: number // 0-1
  viewportEnd: number // 0-1
  rotationAngle?: number
}

const props = withDefaults(defineProps<Props>(), {
  rotationAngle: 0
})

const emit = defineEmits<{
  (e: 'scroll', ratio: number): void
}>()

const thumbnailRef = ref<HTMLElement>()
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const dragStartViewport = ref(0)

/**
 * 根据旋转角度转换滑动增量
 * 旋转后屏幕坐标轴和视觉坐标轴不匹配，需要转换
 */
function getTransformedDelta(deltaX: number, deltaY: number): number {
  if (props.rotationAngle === 90) {
    // 顺时针 90 度：屏幕 Y 轴变成元素的 X 轴
    return deltaY
  } else if (props.rotationAngle === -90) {
    // 逆时针 90 度：屏幕 Y 轴变成元素的 -X 轴
    return -deltaY
  }
  // 无旋转
  return deltaX
}

/**
 * 获取正确的视觉宽度（用于计算滑动比例）
 * 旋转后 rect.width/height 已互换
 */
function getVisualWidth(rect: DOMRect): number {
  if (props.rotationAngle === 90 || props.rotationAngle === -90) {
    // 旋转后，视觉宽度是 rect.height（原始宽度）
    return rect.height
  }
  return rect.width
}

const allKeys = PIANO_KEYS

// 指示器样式
const indicatorStyle = computed(() => {
  const left = props.viewportStart * 100
  const width = (props.viewportEnd - props.viewportStart) * 100
  return {
    left: `${left}%`,
    width: `${width}%`
  }
})

// 获取缩略图琴键样式
function getThumbKeyStyle(key: PianoKey) {
  const isBlack = key.type === 'black'

  // 计算在白键序列中的位置
  let whiteKeyIndex = 0
  for (let i = 0; i <= key.id; i++) {
    if (PIANO_KEYS[i].type === 'white') {
      whiteKeyIndex++
    }
  }

  if (isBlack) {
    // 黑键位置
    const prevWhiteIndex = whiteKeyIndex - 1
    const offsets: Record<string, number> = {
      'C#': 0.6,
      'D#': 1.4,
      'F#': 0.6,
      'G#': 1.0,
      'A#': 1.4
    }
    const offset = offsets[key.note] ?? 0.6
    const left = ((prevWhiteIndex + offset) / WHITE_KEY_COUNT) * 100
    const width = (0.65 / WHITE_KEY_COUNT) * 100

    return {
      left: `${left}%`,
      width: `${width}%`,
      height: '60%',
      top: '0'
    }
  } else {
    // 白键位置
    const left = ((whiteKeyIndex - 1) / WHITE_KEY_COUNT) * 100
    const width = (1 / WHITE_KEY_COUNT) * 100

    return {
      left: `${left}%`,
      width: `${width}%`,
      height: '100%',
      bottom: '0'
    }
  }
}

// 处理点击跳转
function handleClick(event: MouseEvent) {
  if (!thumbnailRef.value) return

  const rect = thumbnailRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const ratio = x / rect.width

  emit('scroll', Math.max(0, Math.min(1, ratio)))
}

// 触摸处理
function handleTouchStart(event: TouchEvent) {
  isDragging.value = true
  dragStartX.value = event.touches[0].clientX
  dragStartY.value = event.touches[0].clientY
  dragStartViewport.value = (props.viewportStart + props.viewportEnd) / 2
}

function handleTouchMove(event: TouchEvent) {
  if (!isDragging.value || !thumbnailRef.value) return

  const rect = thumbnailRef.value.getBoundingClientRect()
  const deltaX = event.touches[0].clientX - dragStartX.value
  const deltaY = event.touches[0].clientY - dragStartY.value

  // 根据旋转角度转换滑动方向
  const transformedDelta = getTransformedDelta(deltaX, deltaY)
  // 使用正确的视觉宽度计算比例
  const visualWidth = getVisualWidth(rect)
  const deltaRatio = transformedDelta / visualWidth

  let newCenter = dragStartViewport.value + deltaRatio
  newCenter = Math.max(0, Math.min(1, newCenter))

  emit('scroll', newCenter)
}

function handleTouchEnd() {
  isDragging.value = false
}

// 指示器拖拽
function handleIndicatorStart(event: TouchEvent) {
  isDragging.value = true
  dragStartX.value = event.touches[0].clientX
  dragStartY.value = event.touches[0].clientY
  dragStartViewport.value = (props.viewportStart + props.viewportEnd) / 2
  event.stopPropagation()
}

function handleIndicatorMove(event: TouchEvent) {
  if (!isDragging.value || !thumbnailRef.value) return

  const rect = thumbnailRef.value.getBoundingClientRect()
  const deltaX = event.touches[0].clientX - dragStartX.value
  const deltaY = event.touches[0].clientY - dragStartY.value

  // 根据旋转角度转换滑动方向
  const transformedDelta = getTransformedDelta(deltaX, deltaY)
  // 使用正确的视觉宽度计算比例
  const visualWidth = getVisualWidth(rect)
  const deltaRatio = transformedDelta / visualWidth

  let newCenter = dragStartViewport.value + deltaRatio
  newCenter = Math.max(0, Math.min(1, newCenter))

  emit('scroll', newCenter)
  event.stopPropagation()
}
</script>

<style scoped>
.piano-thumbnail {
  position: relative;
  width: 100%;
  height: 100%;
  background: #2a2a3e;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  touch-action: none;
}

.thumbnail-keys {
  position: absolute;
  inset: 0;
}

.thumb-key {
  position: absolute;
  border-radius: 1px;
}

.thumb-key:not(.is-black) {
  background: #d0d0d0;
  border: 0.5px solid #999;
}

.thumb-key.is-black {
  background: #333;
  z-index: 2;
}

.viewport-indicator {
  position: absolute;
  top: 0;
  height: 100%;
  background: rgba(100, 150, 255, 0.3);
  border: 2px solid rgba(100, 150, 255, 0.8);
  border-radius: 2px;
  pointer-events: auto;
  touch-action: none;
}
</style>
