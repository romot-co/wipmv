/*単一の AudioContext を使い、
	•	ファイルのデコード
	•	AudioBufferSourceNode の再生/停止/シーク
	•	AnalyserNode でのリアルタイム解析

などを担うサービスクラスです。 */

export class AudioPlaybackService {
  private audioContext: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private analyser: AnalyserNode | null = null;

  private audioBuffer: AudioBuffer | null = null;

  // 状態管理用
  private isPlaying = false;
  private startOffset = 0;   // 再生開始時点
  private startTime = 0;     // AudioContext.currentTime での再生開始タイミング

  // イベントリスナー
  private stateChangeListeners: ((state: AudioPlaybackState) => void)[] = [];

  constructor() {
    this.ensureContext();
  }

  /**
   * 状態変更通知の購読
   */
  public subscribe(listener: (state: AudioPlaybackState) => void): () => void {
    this.stateChangeListeners.push(listener);
    // 現在の状態を即時通知
    listener(this.getState());
    
    // 購読解除用の関数を返す
    return () => {
      this.stateChangeListeners = this.stateChangeListeners.filter(l => l !== listener);
    };
  }

  /**
   * 現在の状態を取得
   */
  private getState(): AudioPlaybackState {
    return {
      isPlaying: this.isPlaying,
      currentTime: this.getCurrentTime(),
      duration: this.getDuration(),
      isSuspended: this.isSuspended
    };
  }

  /**
   * 状態変更を通知
   */
  private notifyStateChange(): void {
    const state = this.getState();
    this.stateChangeListeners.forEach(listener => listener(state));
  }

  /**
   * AudioContext を生成 (まだなければ)
   */
  private ensureContext() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
  }

  public async decodeFile(file: File): Promise<AudioBuffer> {
    this.ensureContext();
    if (!this.audioContext) throw new Error('Failed to create AudioContext');

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.setAudioBuffer(audioBuffer);
    return audioBuffer;
  }

  public setAudioBuffer(buffer: AudioBuffer) {
    this.audioBuffer = buffer;
    this.startOffset = 0;
    this.notifyStateChange();
  }

  /**
   * 現在のAudioBufferを取得
   */
  public getAudioBuffer(): AudioBuffer | null {
    return this.audioBuffer;
  }

  public play() {
    if (!this.audioContext || !this.audioBuffer) return;

    // 既存のソースノードを停止・破棄
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
    }

    // 新しいソースノードを作成
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;

    // アナライザーノードの設定
    if (!this.analyser) {
      this.analyser = this.audioContext.createAnalyser();
    }
    this.sourceNode.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    // 再生開始
    this.sourceNode.start(0, this.startOffset);
    this.startTime = this.audioContext.currentTime;
    this.isPlaying = true;

    this.notifyStateChange();
  }

  public pause() {
    if (!this.isPlaying || !this.sourceNode) return;

    // 現在の再生位置を保存して停止
    this.startOffset = this.getCurrentTime();
    this.sourceNode.stop();
    this.sourceNode.disconnect();
    this.sourceNode = null;
    this.isPlaying = false;

    this.notifyStateChange();
  }

  public stop() {
    if (!this.sourceNode) return;

    this.sourceNode.stop();
    this.sourceNode.disconnect();
    this.sourceNode = null;
    this.startOffset = 0;
    this.isPlaying = false;

    this.notifyStateChange();
  }

  public seek(timeSec: number) {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.pause();
    }

    this.startOffset = Math.max(0, Math.min(timeSec, this.getDuration()));

    if (wasPlaying) {
      this.play();
    } else {
      this.notifyStateChange();
    }
  }

  public getCurrentTime(): number {
    if (this.isPlaying && this.audioContext) {
      return this.startOffset + (this.audioContext.currentTime - this.startTime);
    }
    return this.startOffset;
  }

  public getDuration(): number {
    return this.audioBuffer ? this.audioBuffer.duration : 0;
  }

  public getAnalyserNode(): AnalyserNode | null {
    return this.analyser;
  }

  public get isSuspended(): boolean {
    return this.audioContext?.state === 'suspended' ?? false;
  }

  public async resumeContext() {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
      this.notifyStateChange();
    }
  }

  public dispose() {
    this.stop();
    this.audioContext?.close();
    this.audioContext = null;
    this.audioBuffer = null;
    this.analyser = null;
    this.stateChangeListeners = [];
  }
}

export interface AudioPlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isSuspended: boolean;
}