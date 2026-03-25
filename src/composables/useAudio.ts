import { ref, computed } from 'vue'
import { pianoSynth } from '../utils/audio'
import type { AudioState } from '../types/piano'

/**
 * 音频管理组合式函数
 */
export function useAudio() {
  const state = ref<AudioState>({
    isInitialized: false,
    isPlaying: false,
    transpose: 0,
    sustainTime: 300 // 默认300ms延音
  })

  const isReady = computed(() => state.value.isInitialized)

  /**
   * 初始化音频
   * 必须在用户交互后调用
   */
  async function init(): Promise<boolean> {
    if (state.value.isInitialized) return true

    const success = await pianoSynth.init()
    if (success) {
      state.value.isInitialized = true
    }
    return success
  }

  /**
   * 设置移调
   * @param value 移调值 (-12 ~ +12)
   */
  function setTranspose(value: number): void {
    state.value.transpose = Math.max(-12, Math.min(12, value))
  }

  /**
   * 增加移调
   */
  function increaseTranspose(): void {
    setTranspose(state.value.transpose + 1)
  }

  /**
   * 减少移调
   */
  function decreaseTranspose(): void {
    setTranspose(state.value.transpose - 1)
  }

  /**
   * 设置延音时间
   * @param value 延音时间 (ms, 0-1000)
   */
  function setSustainTime(value: number): void {
    state.value.sustainTime = Math.max(0, Math.min(1000, value))
    // 同步到音频合成器
    pianoSynth.setSustainTime(state.value.sustainTime)
  }

  return {
    state,
    isReady,
    init,
    setTranspose,
    increaseTranspose,
    decreaseTranspose,
    setSustainTime
  }
}
