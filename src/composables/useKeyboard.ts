import { ref, computed } from 'vue'
import { PIANO_KEYS, getWhiteKeys, getBlackKeys, getTransposedKey } from '../utils/piano'
import { pianoSynth } from '../utils/audio'
import type { ActiveKey, AudioState } from '../types/piano'
import type { Ref } from 'vue'

/**
 * 键盘交互管理
 */
export function useKeyboard(audioState: Ref<AudioState>) {
  // 激活的琴键 (支持多点触控)
  const activeKeys = ref<ActiveKey[]>([])

  // 停止超时管理 (keyId -> timeoutId)
  const stopTimeouts = ref<Map<number, number>>(new Map())

  // 移调后的琴键列表（用于显示）
  const transposedKeys = computed(() => {
    const transpose = audioState.value.transpose
    if (transpose === 0) {
      return [...PIANO_KEYS]
    }
    return PIANO_KEYS.map(key => getTransposedKey(key, transpose))
  })

  // 白键和黑键列表（基于移调后的琴键）
  const whiteKeys = computed(() => getWhiteKeys(transposedKeys.value))
  const blackKeys = computed(() => getBlackKeys(transposedKeys.value))

  /**
   * 检查琴键是否处于激活状态
   */
  const isKeyActive = computed(() => (keyId: number) => {
    return activeKeys.value.some(k => k.keyId === keyId)
  })

  /**
   * 获取触摸标识对应的琴键
   */
  function getKeyByTouchId(touchId: number): ActiveKey | undefined {
    return activeKeys.value.find(k => k.touchId === touchId)
  }

  /**
   * 按下琴键
   */
  function pressKey(keyId: number, touchId: number): void {

    // 避免重复触发同一触摸点的同一琴键
    if (activeKeys.value.some(k => k.keyId === keyId && k.touchId === touchId)) {
            return
    }

    // 移除同一触摸点的其他琴键 (滑动演奏时)
    const existingKey = getKeyByTouchId(touchId)
    if (existingKey) {
          }
    releaseByTouchId(touchId)

    const key = PIANO_KEYS.find(k => k.id === keyId)
    if (!key) {
      return
    }

    // 如果该琴键有等待中的停止超时，取消它（用户重新按下）
    cancelStopTimeout(keyId)

    // 播放声音
    pianoSynth.play(key, audioState.value.transpose)

    // 添加到激活列表
    activeKeys.value.push({ keyId, touchId })
      }

  /**
   * 取消指定琴键的停止超时
   */
  function cancelStopTimeout(keyId: number): void {
    const timeoutId = stopTimeouts.value.get(keyId)
    if (timeoutId) {
            clearTimeout(timeoutId)
      stopTimeouts.value.delete(keyId)
    }
  }

  /**
   * 释放琴键（延迟停止，根据延音设置）
   */
  function releaseKey(keyId: number, touchId?: number): void {
    
    // 从激活列表中移除
    if (touchId !== undefined) {
      activeKeys.value = activeKeys.value.filter(
        k => !(k.keyId === keyId && k.touchId === touchId)
      )
    } else {
      activeKeys.value = activeKeys.value.filter(k => k.keyId !== keyId)
    }
    
    // 检查是否还有其他触摸点按着同一个琴键
    const isStillActive = activeKeys.value.some(k => k.keyId === keyId)
    if (isStillActive) {
            return
    }

    const key = PIANO_KEYS.find(k => k.id === keyId)
    if (!key) {
      return
    }

    // 取消之前的停止超时（如果有）
    cancelStopTimeout(keyId)

    const sustainTime = audioState.value.sustainTime

    // 设置延迟停止
    const timeoutId = window.setTimeout(() => {
      pianoSynth.stop(keyId)
      stopTimeouts.value.delete(keyId)
    }, sustainTime)

    stopTimeouts.value.set(keyId, timeoutId)
  }

  /**
   * 根据触摸 ID 释放琴键
   */
  function releaseByTouchId(touchId: number): void {
    const key = getKeyByTouchId(touchId)
    if (key) {
      releaseKey(key.keyId, touchId)
    }
  }

  /**
   * 释放所有琴键
   */
  function releaseAll(): void {
    // 清理所有停止超时
    stopTimeouts.value.forEach((timeoutId) => {
      clearTimeout(timeoutId)
    })
    stopTimeouts.value.clear()

    activeKeys.value.forEach(({ keyId }) => {
      pianoSynth.stop(keyId)
    })
    activeKeys.value = []
  }

  return {
    allKeys: PIANO_KEYS,
    whiteKeys,
    blackKeys,
    activeKeys,
    isKeyActive,
    pressKey,
    releaseKey,
    releaseByTouchId,
    releaseAll,
    getKeyByTouchId
  }
}
