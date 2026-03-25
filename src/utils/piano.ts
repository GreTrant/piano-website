import type { NoteName, PianoKey, KeyType } from '../types/piano'

/** 音符名称列表 */
const NOTE_NAMES: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

/** 黑键音符 */
const BLACK_KEYS: NoteName[] = ['C#', 'D#', 'F#', 'G#', 'A#']

/**
 * 计算音符频率 (使用十二平均律)
 * @param midiNote MIDI 音符编号 (0-127)
 * @returns 频率 (Hz)
 */
export function getFrequency(midiNote: number): number {
  // A4 = 69 = 440Hz
  return 440 * Math.pow(2, (midiNote - 69) / 12)
}

/**
 * 判断音符是否为黑键
 * @param note 音符名称
 * @returns 是否为黑键
 */
export function isBlackKey(note: NoteName): boolean {
  return BLACK_KEYS.includes(note)
}

/**
 * 获取音符类型
 * @param note 音符名称
 * @returns 琴键类型
 */
export function getKeyType(note: NoteName): KeyType {
  return isBlackKey(note) ? 'black' : 'white'
}

/**
 * 生成 88 键钢琴数据
 * 标准钢琴: A0 (21) 到 C8 (108)
 * @returns 88 个琴键的数据数组
 */
export function generatePianoKeys(): PianoKey[] {
  const keys: PianoKey[] = []

  // 标准钢琴 MIDI 范围: 21 (A0) - 108 (C8)
  const startMidi = 21
  const endMidi = 108

  for (let midiNote = startMidi; midiNote <= endMidi; midiNote++) {
    const noteIndex = midiNote % 12
    const octave = Math.floor(midiNote / 12) - 1
    const note = NOTE_NAMES[noteIndex]

    keys.push({
      id: midiNote - startMidi, // 0-87
      note,
      octave,
      type: getKeyType(note),
      midiNote,
      frequency: getFrequency(midiNote)
    })
  }

  return keys
}

/**
 * 获取白键列表
 * @param keys 所有琴键
 * @returns 白键列表
 */
export function getWhiteKeys(keys: PianoKey[]): PianoKey[] {
  return keys.filter(key => key.type === 'white')
}

/**
 * 获取黑键列表
 * @param keys 所有琴键
 * @returns 黑键列表
 */
export function getBlackKeys(keys: PianoKey[]): PianoKey[] {
  return keys.filter(key => key.type === 'black')
}

/**
 * 计算黑键在白键中的相对位置
 * @param note 音符名称
 * @returns 相对于前一个白键的水平偏移比例 (0-1)
 */
export function getBlackKeyOffset(note: NoteName): number {
  // 黑键位置: C#=0.6, D#=1.4, F#=0.6, G#=1.0, A#=1.4
  const offsets: Record<string, number> = {
    'C#': 0.6,
    'D#': 1.4,
    'F#': 0.6,
    'G#': 1.0,
    'A#': 1.4
  }
  return offsets[note] ?? 0.6
}

/**
 * 计算移调后的 MIDI 音符
 * @param baseMidiNote 原始 MIDI 音符
 * @param transpose 移调值
 * @returns 移调后的 MIDI 音符
 */
export function getTransposedMidiNote(baseMidiNote: number, transpose: number): number {
  return baseMidiNote + transpose
}

/**
 * 获取移调后的频率
 * @param baseFrequency 原始频率
 * @param transpose 移调值
 * @returns 移调后的频率
 */
export function getTransposedFrequency(baseFrequency: number, transpose: number): number {
  if (!Number.isFinite(baseFrequency)) {
    return 440 // 返回默认频率
  }
  return baseFrequency * Math.pow(2, transpose / 12)
}

/**
 * 获取移调后的音符名称和八度
 * @param note 原始音符名称
 * @param octave 原始八度
 * @param transpose 移调值（半音数）
 * @returns 移调后的音符名称和八度
 */
export function getTransposedNote(note: NoteName, octave: number, transpose: number): { note: NoteName, octave: number } {
  const noteIndex = NOTE_NAMES.indexOf(note)
  if (noteIndex === -1) {
    return { note, octave }
  }

  // 计算新的音符索引和八度
  const totalSemitones = noteIndex + transpose
  const newNoteIndex = ((totalSemitones % 12) + 12) % 12 // 处理负数的模运算
  const newOctave = octave + Math.floor(totalSemitones / 12)

  // 确保八度在合理范围内（钢琴范围A0-C8）
  // 对于显示目的，我们允许超出范围，但实际播放时会限制
  const newNote = NOTE_NAMES[newNoteIndex]
  return { note: newNote, octave: newOctave }
}

/**
 * 获取移调后的琴键数据（用于显示标签）
 * @param key 原始琴键数据
 * @param transpose 移调值（半音数）
 * @returns 移调后的琴键数据（保持id、type、midiNote、frequency不变，只更新note和octave用于显示）
 */
export function getTransposedKey(key: PianoKey, transpose: number): PianoKey {
  if (transpose === 0) {
    return key
  }

  const { note: transposedNote, octave: transposedOctave } = getTransposedNote(key.note, key.octave, transpose)

  return {
    ...key,
    note: transposedNote,
    octave: transposedOctave
  }
}

/** 88 键钢琴数据 (单例) */
export const PIANO_KEYS: readonly PianoKey[] = Object.freeze(generatePianoKeys())

/** 白键数量 */
export const WHITE_KEY_COUNT = 52

/** 黑键数量 */
export const BLACK_KEY_COUNT = 36

/** 琴键总宽度比例 (相对于白键宽度) */
export const KEY_WIDTH_RATIO = {
  white: 1,
  black: 0.65
}

/** 琴键高度比例 */
export const KEY_HEIGHT_RATIO = {
  white: 1,
  black: 0.6
}
