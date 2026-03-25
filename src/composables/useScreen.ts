import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Orientation, ScreenInfo } from '../types/piano'

/**
 * 屏幕方向和尺寸管理
 * 初始根据窗口大小自动判断，用户可手动切换
 */
export function useScreen() {
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)

  // 设备物理方向（基于宽高比）
  const deviceOrientation = computed<Orientation>(() => {
    return width.value > height.value ? 'landscape' : 'portrait'
  })

  // 用户选择的方向（初始跟随设备方向）
  const orientation = ref<Orientation>(deviceOrientation.value)

  // 是否需要旋转页面
  const needsRotation = computed(() => {
    return deviceOrientation.value !== orientation.value
  })

  // 旋转角度
  const rotationAngle = computed(() => {
    if (!needsRotation.value) return 0
    // 设备竖屏但选择横屏 -> 旋转90度
    // 设备横屏但选择竖屏 -> 旋转-90度
    return deviceOrientation.value === 'portrait' ? 90 : -90
  })

  const isLandscape = computed(() => orientation.value === 'landscape')
  const isPortrait = computed(() => orientation.value === 'portrait')

  const screenInfo = computed<ScreenInfo>({
    get: () => ({
      width: width.value,
      height: height.value,
      orientation: orientation.value
    }),
    set: () => {}
  })

  // 旋转后的视口尺寸
  const viewportSize = computed(() => {
    if (needsRotation.value) {
      return {
        width: height.value,
        height: width.value
      }
    }
    return {
      width: width.value,
      height: height.value
    }
  })

  /**
   * 更新屏幕尺寸
   */
  function updateSize(): void {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  /**
   * 切换方向（横屏<->竖屏）
   */
  function toggleOrientation(): void {
    orientation.value = orientation.value === 'landscape' ? 'portrait' : 'landscape'
  }

  onMounted(() => {
    window.addEventListener('resize', updateSize)
    window.addEventListener('orientationchange', updateSize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateSize)
    window.removeEventListener('orientationchange', updateSize)
  })

  return {
    width,
    height,
    orientation,
    deviceOrientation,
    isLandscape,
    isPortrait,
    needsRotation,
    rotationAngle,
    viewportSize,
    screenInfo,
    toggleOrientation
  }
}
