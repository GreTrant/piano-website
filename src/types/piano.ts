/**
 * 钢琴相关类型定义
 */

/** 音符名称 */
export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B'

/** 琴键类型 */
export type KeyType = 'white' | 'black'

/** 单个琴键数据 */
export interface PianoKey {
  /** 琴键唯一编号 (0-87, 0=A0, 87=C8) */
  id: number
  /** 音符名称 */
  note: NoteName
  /**  octave 编号 */
  octave: number
  /** 琴键类型 */
  type: KeyType
  /** 标准 MIDI 音高编号 (21-108) */
  midiNote: number
  /** 频率 (Hz) */
  frequency: number
}

/** 触摸中的琴键状态 */
export interface ActiveKey {
  /** 琴键 ID */
  keyId: number
  /** 触摸点 ID */
  touchId: number
}

/** 移调范围 */
export type TransposeValue = number

/** 音频上下文状态 */
export interface AudioState {
  /** 是否已初始化 */
  isInitialized: boolean
  /** 是否正在播放 */
  isPlaying: boolean
  /** 当前移调值 (-12 ~ +12) */
  transpose: TransposeValue
  /** 延音时间 (ms, 0-1000) */
  sustainTime: number
}

/** 视口信息 */
export interface ViewportInfo {
  /** 可见起始琴键 */
  startKey: number
  /** 可见结束琴键 */
  endKey: number
  /** 滚动位置比例 (0-1) */
  scrollRatio: number
}

/** 屏幕方向 */
export type Orientation = 'landscape' | 'portrait'

/** 屏幕方向模式 */
export type OrientationMode = 'auto' | Orientation

/** 屏幕尺寸信息 */
export interface ScreenInfo {
  width: number
  height: number
  orientation: Orientation
}
