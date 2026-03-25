<template>
  <div class="control-panel">
    <!-- 标题和方向控制 -->
    <div class="panel-header">
      <div class="panel-title">钢琴</div>

      <!-- 方向切换按钮 -->
      <button
        class="orientation-btn"
        @click="$emit('toggle-orientation')"
        title="点击切换横竖屏"
      >
        <span class="orientation-label">{{ isLandscape ? '横屏' : '竖屏' }}</span>
      </button>
    </div>

    <!-- 移调控制 -->
    <div class="transpose-control">
      <button
        class="transpose-btn"
        :disabled="transpose <= -12"
        @click="$emit('decrease-transpose')"
      >
        -1
      </button>

      <div class="transpose-display">
        <span class="transpose-label">移调</span>
        <span class="transpose-value" :class="{ 'is-transposed': transpose !== 0 }">
          {{ transpose > 0 ? `+${transpose}` : transpose }}
        </span>
      </div>

      <button
        class="transpose-btn"
        :disabled="transpose >= 12"
        @click="$emit('increase-transpose')"
      >
        +1
      </button>
    </div>

    <!-- 重置按钮 -->
    <button
      v-if="transpose !== 0"
      class="reset-btn"
      @click="$emit('reset-transpose')"
    >
      重置
    </button>

    <!-- 延音控制 -->
    <div class="sustain-control">
      <input
        type="range"
        class="sustain-slider"
        :value="sustainTime"
        min="0"
        max="1000"
        step="10"
        @input="$emit('update-sustain-time', parseInt(($event.target as HTMLInputElement).value))"
      />
      <div class="sustain-display">
        <span class="sustain-label">延音</span>
        <span class="sustain-value">{{ sustainTime }}ms</span>
      </div>
    </div>

    <!-- 声音激活提示 -->
    <div v-if="!isAudioReady" class="audio-hint">
      点击任意位置激活声音
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  transpose: number
  isAudioReady: boolean
  sustainTime: number
  isLandscape: boolean
}

defineProps<Props>()

defineEmits<{
  (e: 'increase-transpose'): void
  (e: 'decrease-transpose'): void
  (e: 'reset-transpose'): void
  (e: 'update-sustain-time', value: number): void
  (e: 'toggle-orientation'): void
}>()
</script>

<style scoped>
.control-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: linear-gradient(180deg, #2d2d44 0%, #1a1a2e 100%);
  border-bottom: 1px solid #333;
  gap: 12px;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-title {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

/* 方向切换按钮 */
.orientation-btn {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border: 1px solid #6af;
  border-radius: 6px;
  background: rgba(102, 170, 255, 0.15);
  color: #6af;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.orientation-btn:hover {
  background: rgba(102, 170, 255, 0.25);
}

.orientation-btn:active {
  transform: scale(0.96);
}

.orientation-label {
  font-size: 13px;
}

.transpose-control {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  justify-content: center;
}

.transpose-btn {
  width: 44px;
  height: 36px;
  border: none;
  border-radius: 6px;
  background: linear-gradient(180deg, #4a4a6a 0%, #3a3a5a 100%);
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.transpose-btn:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.transpose-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.transpose-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
}

.transpose-label {
  font-size: 10px;
  color: #888;
  text-transform: uppercase;
}

.transpose-value {
  font-size: 20px;
  font-weight: bold;
  color: #aaa;
}

.transpose-value.is-transposed {
  color: #6af;
}

.reset-btn {
  padding: 8px 16px;
  border: 1px solid #666;
  border-radius: 6px;
  background: transparent;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.reset-btn:active {
  background: rgba(255, 255, 255, 0.1);
}

/* 延音控制样式 */
.sustain-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 120px;
  gap: 4px;
}

.sustain-slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(90deg, #4a4a6a 0%, #6af 100%);
  -webkit-appearance: none;
  appearance: none;
  outline: none;
  cursor: pointer;
}

.sustain-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.sustain-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  border: none;
}

.sustain-display {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sustain-label {
  font-size: 10px;
  color: #888;
  text-transform: uppercase;
}

.sustain-value {
  font-size: 12px;
  font-weight: bold;
  color: #6af;
}

.audio-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 12px 24px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  border-radius: 8px;
  font-size: 14px;
  pointer-events: none;
  animation: pulse 2s ease-in-out infinite;
  z-index: 100;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
}
</style>
