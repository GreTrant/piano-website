<template>
  <div
    ref="appRef"
    class="app-wrapper"
    :class="{ 'is-rotated': needsRotation }"
    @click="handleActivateAudio"
  >
    <div
      class="app"
      :class="{ 'is-landscape': isLandscape, 'is-portrait': isPortrait }"
      :style="rotationStyle"
    >
      <!-- 控制面板 -->
      <ControlPanel
        :transpose="transpose"
        :is-audio-ready="isAudioReady"
        :sustain-time="audioState?.sustainTime ?? 300"
        :is-landscape="isLandscape"
        @increase-transpose="increaseTranspose"
        @decrease-transpose="decreaseTranspose"
        @reset-transpose="resetTranspose"
        @update-sustain-time="setSustainTime"
        @toggle-orientation="toggleOrientation"
      />

      <!-- 钢琴键盘区域 -->
      <div ref="keyboardContainerRef" class="keyboard-container">
        <div
          ref="scrollContainerRef"
          class="scroll-container"
          @scroll="handleScroll"
        >
          <div
            class="keyboard-wrapper"
            :style="keyboardWrapperStyle"
          >
            <PianoKeyboard
              :white-keys="whiteKeys"
              :black-keys="blackKeys"
              :is-key-active="isKeyActive"
              :is-landscape="isLandscape"
              :show-labels="true"
              @press="handleKeyPress"
              @release="handleKeyRelease"
            />
          </div>
        </div>
      </div>

      <!-- 底部缩略图 -->
      <div class="thumbnail-container">
        <PianoThumbnail
          :viewport-start="viewportStart"
          :viewport-end="viewportEnd"
          :rotation-angle="rotationAngle"
          @scroll="handleThumbnailScroll"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import ControlPanel from './components/ControlPanel.vue'
import PianoKeyboard from './components/PianoKeyboard.vue'
import PianoThumbnail from './components/PianoThumbnail.vue'
import { useAudio } from './composables/useAudio'
import { useScreen } from './composables/useScreen'
import { useKeyboard } from './composables/useKeyboard'
import { pianoSynth } from './utils/audio'
import { PIANO_KEYS } from './utils/piano'

// 屏幕适配
const {
  isLandscape,
  isPortrait,
  needsRotation,
  rotationAngle,
  viewportSize,
  toggleOrientation
} = useScreen()

// 音频管理
const { state: audioState, isReady: isAudioReady, init: initAudio, increaseTranspose, decreaseTranspose, setSustainTime } = useAudio()

// 键盘管理
const keyboard = useKeyboard(audioState)
const { whiteKeys, blackKeys, isKeyActive, pressKey, releaseByTouchId } = keyboard

// 移调值
const transpose = computed({
  get: () => audioState.value.transpose,
  set: (val: number) => {
    audioState.value.transpose = Math.max(-12, Math.min(12, val))
  }
})

// 重置移调
function resetTranspose() {
  transpose.value = 0
}

// 键盘容器引用
const scrollContainerRef = ref<HTMLElement>()

// 视口位置
const viewportStart = ref(0)
const viewportEnd = ref(1)

// 键盘包装器样式
const keyboardWrapperStyle = computed(() => {
  return {
    height: '100%'
  }
})

// 旋转容器样式
const rotationStyle = computed(() => {
  if (!needsRotation.value) {
    return {}
  }

  const angle = rotationAngle.value
  const vw = viewportSize.value.width
  const vh = viewportSize.value.height

  return {
    transform: `rotate(${angle}deg)`,
    transformOrigin: 'center center',
    width: `${vw}px`,
    height: `${vh}px`,
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    marginLeft: `-${vw / 2}px`,
    marginTop: `-${vh / 2}px`
  }
})

// 计算视口大小比例
function getViewportSize(): number {
  if (!scrollContainerRef.value) return 0.5
  const container = scrollContainerRef.value
  return container.clientWidth / container.scrollWidth
}

// 处理滚动
function handleScroll() {
  if (!scrollContainerRef.value) return

  const container = scrollContainerRef.value
  const scrollLeft = container.scrollLeft
  const maxScroll = container.scrollWidth - container.clientWidth

  if (maxScroll > 0) {
    const scrollRatio = scrollLeft / maxScroll
    const viewportSize = getViewportSize()

    // 将滚动比例转换为视口位置
    viewportStart.value = scrollRatio * (1 - viewportSize)
    viewportEnd.value = viewportStart.value + viewportSize
  } else {
    viewportStart.value = 0
    viewportEnd.value = 1
  }
}

// 处理缩略图滚动
function handleThumbnailScroll(ratio: number) {
  if (!scrollContainerRef.value) return

  const container = scrollContainerRef.value
  const maxScroll = container.scrollWidth - container.clientWidth
  const viewportSize = getViewportSize()

  // 确保视口不超出边界
  const clampedRatio = Math.max(viewportSize / 2, Math.min(1 - viewportSize / 2, ratio))

  viewportStart.value = clampedRatio - viewportSize / 2
  viewportEnd.value = clampedRatio + viewportSize / 2

  // 同步滚动
  if (maxScroll > 0) {
    const scrollRatio = (viewportStart.value) / (1 - viewportSize)
    container.scrollLeft = scrollRatio * maxScroll
  }
}

// 初始化视口
function updateViewport() {
  if (!scrollContainerRef.value) return

  const container = scrollContainerRef.value
  const maxScroll = container.scrollWidth - container.clientWidth
  const scrollLeft = container.scrollLeft
  const viewportSize = getViewportSize()

  if (maxScroll > 0) {
    const scrollRatio = scrollLeft / maxScroll
    viewportStart.value = scrollRatio * (1 - viewportSize)
    viewportEnd.value = viewportStart.value + viewportSize
  } else {
    viewportStart.value = 0
    viewportEnd.value = viewportSize
  }
}

// 将 C4-B4 区域居中显示
function centerOnC4B4() {
  if (!scrollContainerRef.value) return

  const container = scrollContainerRef.value
  const totalWidth = container.scrollWidth
  const viewportWidth = container.clientWidth

  if (totalWidth <= viewportWidth) return

  // 找到C4和B4的琴键数据
  const c4Key = PIANO_KEYS.find(key => key.note === 'C' && key.octave === 4)
  const b4Key = PIANO_KEYS.find(key => key.note === 'B' && key.octave === 4)

  if (!c4Key || !b4Key) return

  // 获取白键列表
  const whiteKeyList = PIANO_KEYS.filter(key => key.type === 'white')

  // 找到C4和B4在白键列表中的索引
  const c4Index = whiteKeyList.findIndex(key => key.id === c4Key.id)
  const b4Index = whiteKeyList.findIndex(key => key.id === b4Key.id)

  if (c4Index === -1 || b4Index === -1) return

  // 白键宽度（与PianoKeyboard.vue中的保持一致）
  const WHITE_KEY_WIDTH = 60

  // 计算C4和B4的中心位置
  const c4Center = c4Index * WHITE_KEY_WIDTH + WHITE_KEY_WIDTH / 2
  const b4Center = b4Index * WHITE_KEY_WIDTH + WHITE_KEY_WIDTH / 2
  const targetCenter = (c4Center + b4Center) / 2

  // 计算滚动位置，使目标中心点位于视口中央
  const targetScrollLeft = targetCenter - viewportWidth / 2

  // 限制滚动范围
  const maxScroll = totalWidth - viewportWidth
  const clampedScrollLeft = Math.max(0, Math.min(maxScroll, targetScrollLeft))

  container.scrollLeft = clampedScrollLeft

  // 更新视口显示
  updateViewport()
}

// 处理琴键按下
function handleKeyPress(keyId: number, touchId: number) {
  // 确保音频已初始化
  if (!isAudioReady.value) {
    initAudio()
  }

  pressKey(keyId, touchId)
}

// 处理琴键释放
function handleKeyRelease(_keyId: number, touchId: number) {
  releaseByTouchId(touchId)
}

// 激活音频
async function handleActivateAudio() {
  if (!isAudioReady.value) {
    await initAudio()
  }
}

// 键盘事件处理 (支持电脑键盘)
function handleKeyDown(event: KeyboardEvent) {
  const keyMap: Record<string, number> = {
    'z': 0, 's': 1, 'x': 2, 'd': 3, 'c': 4, 'v': 5, 'g': 6, 'b': 7, 'h': 8, 'n': 9, 'j': 10, 'm': 11,
    'q': 12, '2': 13, 'w': 14, '3': 15, 'e': 16, 'r': 17, '5': 18, 't': 19, '6': 20, 'y': 21, '7': 22, 'u': 23,
    'i': 24, '9': 25, 'o': 26, '0': 27, 'p': 28
  }

  const keyId = keyMap[event.key.toLowerCase()]
  if (keyId !== undefined) {
    handleKeyPress(keyId, -1)
  }
}

function handleKeyUp(event: KeyboardEvent) {
  const keyMap: Record<string, number> = {
    'z': 0, 's': 1, 'x': 2, 'd': 3, 'c': 4, 'v': 5, 'g': 6, 'b': 7, 'h': 8, 'n': 9, 'j': 10, 'm': 11,
    'q': 12, '2': 13, 'w': 14, '3': 15, 'e': 16, 'r': 17, '5': 18, 't': 19, '6': 20, 'y': 21, '7': 22, 'u': 23,
    'i': 24, '9': 25, 'o': 26, '0': 27, 'p': 28
  }

  const keyId = keyMap[event.key.toLowerCase()]
  if (keyId !== undefined) {
    handleKeyRelease(keyId, -1)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  window.addEventListener('resize', updateViewport)

  // 初始化视口
  setTimeout(() => {
    updateViewport()
    centerOnC4B4()
  }, 100)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  window.removeEventListener('resize', updateViewport)
  pianoSynth.stopAll()
})
</script>

<style scoped>
.app-wrapper {
  width: 100%;
  height: 100%;
  background: #1a1a2e;
  overflow: hidden;
  position: relative;
}

.app {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #1a1a2e;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.keyboard-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  padding: 8px;
}

.scroll-container {
  width: 100%;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scroll-container::-webkit-scrollbar {
  display: none;
}

.keyboard-wrapper {
  height: 100%;
  position: relative;
}

.thumbnail-container {
  height: 50px;
  padding: 4px 8px 8px;
  flex-shrink: 0;
}

/* 横屏适配 */
.is-landscape .keyboard-container {
  padding: 12px 16px;
}

.is-landscape .thumbnail-container {
  height: 60px;
  padding: 6px 16px 12px;
}

/* 竖屏适配 */
.is-portrait .scroll-container {
  overflow-x: auto;
}
</style>
