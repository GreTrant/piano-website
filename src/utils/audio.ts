/**
 * 音频处理工具 - 使用 Web Audio API
 */

// 修改时间: 2026-03-24 09:30 - 添加forceStop方法
import { getTransposedFrequency } from './piano'
import type { PianoKey } from '../types/piano'

/**
 * 音频合成器 - 使用振荡器生成钢琴音色
 * 由于无法加载外部音频文件，使用合成方式模拟钢琴音色
 */
export class PianoSynthesizer {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private reverbNode: ConvolverNode | null = null
  private activeOscillators: Map<number, OscillatorNode[]> = new Map()
  private activeGains: Map<number, GainNode> = new Map()
  private stopTimeouts: Map<number, number> = new Map()
  private cleanupTimeouts: Map<number, number> = new Map()
  private sustainTime = 300 // 延音时间 (ms)，默认300ms

  /**
   * 初始化音频上下文
   * 必须在用户交互后调用
   */
  async init(): Promise<boolean> {
    if (this.audioContext) return true

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      this.audioContext = new AudioContextClass()

      // 主音量控制
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = 0.5
      this.masterGain.connect(this.audioContext.destination)

      // 创建简单的混响效果
      await this.createReverb()

      // 恢复音频上下文 (处理自动播放策略)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 创建混响效果
   */
  private async createReverb(): Promise<void> {
    if (!this.audioContext) return

    this.reverbNode = this.audioContext.createConvolver()

    // 创建简单的脉冲响应
    const sampleRate = this.audioContext.sampleRate
    const length = sampleRate * 1.5 // 1.5秒混响
    const impulse = this.audioContext.createBuffer(2, length, sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        // 指数衰减
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3)
      }
    }

    this.reverbNode.buffer = impulse
    this.reverbNode.connect(this.masterGain!)
  }

  /**
   * 播放音符
   * @param key 琴键数据
   * @param transpose 移调值
   * @returns 是否成功播放
   */
  play(key: PianoKey, transpose: number = 0): boolean {
    if (!this.audioContext || !this.masterGain) {
      return false
    }

    // 确保音频上下文正在运行
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    // 停止同键的先前声音
    this.forceStop(key.id)
    this.stop(key.id)

    const frequency = getTransposedFrequency(key.frequency, transpose)

    // 验证频率值有效性
    if (!Number.isFinite(frequency) || frequency <= 0) {
      return false
    }

    // 创建多个振荡器模拟钢琴音色 (基波 + 泛音)
    const oscillators: OscillatorNode[] = []
    const harmonicRatios = [1, 2, 3, 4, 5, 6]
    const harmonicGains = [1, 0.5, 0.25, 0.15, 0.1, 0.05]

    // 主增益节点 (包络控制)
    const noteGain = this.audioContext.createGain()
    noteGain.connect(this.masterGain)
    if (this.reverbNode) {
      noteGain.connect(this.reverbNode)
    }

    const now = this.audioContext.currentTime

    // 攻击阶段
    noteGain.gain.setValueAtTime(0, now)
    noteGain.gain.linearRampToValueAtTime(0.3, now + 0.01)

    // 衰减阶段 (钢琴音色特点: 快速衰减后缓慢消失)
    noteGain.gain.exponentialRampToValueAtTime(0.15, now + 0.1)
    noteGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0)

    // 创建泛音
    harmonicRatios.forEach((ratio, index) => {
      const osc = this.audioContext!.createOscillator()
      const oscGain = this.audioContext!.createGain()

      // 混合不同波形以获得更丰富的音色
      const waveTypes: OscillatorType[] = ['triangle', 'sine', 'sawtooth', 'sine', 'triangle', 'sine']
      osc.type = waveTypes[index]

      // 计算泛音频率并确保有效
      let harmonicFreq = frequency * ratio
      if (index > 0) {
        // 高频泛音稍微失谐，增加自然感
        harmonicFreq += (Math.random() - 0.5) * 2
      }
      // 确保频率值有效
      osc.frequency.value = Number.isFinite(harmonicFreq) ? harmonicFreq : frequency

      oscGain.gain.value = harmonicGains[index]

      osc.connect(oscGain)
      oscGain.connect(noteGain)
      osc.start(now)

      oscillators.push(osc)
    })

    // 保存引用以便停止
    this.activeOscillators.set(key.id, oscillators)
    this.activeGains.set(key.id, noteGain)

    // 安全自动清理（延音时间+2000ms作为安全网）
    const safetyTimeout = this.sustainTime + 2000
    const timeoutId = window.setTimeout(() => {
      this.stop(key.id)
      this.stopTimeouts.delete(key.id)
    }, safetyTimeout)

    // 如果已有该键的超时，先清除
    const existingTimeout = this.stopTimeouts.get(key.id)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }
    this.stopTimeouts.set(key.id, timeoutId)

    return true
  }

  /**
   * 停止播放音符
   * @param keyId 琴键 ID
   */
  stop(keyId: number): void {

    const oscillators = this.activeOscillators.get(keyId)
    const gainNode = this.activeGains.get(keyId)

    if (!oscillators || !gainNode || !this.audioContext) {
      return
    }

    const now = this.audioContext.currentTime

    // 快速衰减 (释音阶段)
    gainNode.gain.cancelScheduledValues(now)
    gainNode.gain.setValueAtTime(gainNode.gain.value, now)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1)

    // 停止振荡器
    oscillators.forEach((osc, _index) => {
      try {
        osc.stop(now + 0.15)
      } catch (e) {
        // 忽略停止错误
      }
    })

    // 清理引用（200ms后）
    const cleanupId = window.setTimeout(() => {

      // 断开振荡器连接
      oscillators?.forEach((osc) => {
        try {
          osc.disconnect()
        } catch (e) {
          // 忽略已断开的错误
        }
      })

      // 断开增益节点连接
      try {
        gainNode?.disconnect()
      } catch (e) {
        // 忽略已断开的错误
      }

      this.activeOscillators.delete(keyId)
      this.activeGains.delete(keyId)
      this.cleanupTimeouts.delete(keyId)
    }, 200)

    // 清理停止超时
    const existingStopTimeout = this.stopTimeouts.get(keyId)
    if (existingStopTimeout) {
      clearTimeout(existingStopTimeout)
      this.stopTimeouts.delete(keyId)
    }

    // 如果已有该键的清理超时，先清除
    const existingCleanup = this.cleanupTimeouts.get(keyId)
    if (existingCleanup) {
      clearTimeout(existingCleanup)
    }
    this.cleanupTimeouts.set(keyId, cleanupId)
  }

  /**
   * 停止所有声音
   */
  stopAll(): void {
    this.activeOscillators.forEach((_oscillators, keyId) => {
      this.stop(keyId)
    })
  }

  /**
   * 强制停止指定琴键的所有音频节点
   * 用于处理竞态条件和资源清理
   */
  private forceStop(keyId: number): void {

    const oscillators = this.activeOscillators.get(keyId)
    const gainNode = this.activeGains.get(keyId)

    if (oscillators) {
      oscillators.forEach(osc => {
        try {
          osc.stop(0)  // 立即停止
          osc.disconnect()
        } catch (e) {
          // 忽略已停止的振荡器
        }
      })
    }

    if (gainNode) {
      try {
        gainNode.disconnect()
      } catch (e) {
        // 忽略已断开的增益节点
      }
    }

    // 清理所有引用
    this.activeOscillators.delete(keyId)
    this.activeGains.delete(keyId)
    this.stopTimeouts.delete(keyId)
    this.cleanupTimeouts.delete(keyId)
  }

  
  /**
   * 检查音频上下文是否已初始化
   */
  get isInitialized(): boolean {
    return this.audioContext !== null && this.audioContext.state === 'running'
  }

  /**
   * 设置延音时间
   * @param time 延音时间 (ms, 0-1000)
   */
  setSustainTime(time: number): void {
    this.sustainTime = Math.max(0, Math.min(1000, time))
  }

  /**
   * 获取音频上下文状态
   */
  get state(): AudioContextState {
    return this.audioContext?.state ?? 'suspended'
  }
}

/** 单例实例 */
export const pianoSynth = new PianoSynthesizer()
