/*単一の AudioContext を使い、
	•	ファイルのデコード
	•	AudioBufferSourceNode の再生/停止/シーク
	•	AnalyserNode でのリアルタイム解析

などを担うサービスクラスです。 */

export class AudioPlaybackService {
  private audioContext: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private updateInterval: number | null = null;  // 追加: 更新用インターバル

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
    console.log('AudioPlaybackService: State changed', state);
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

    console.log('ファイルのデコード開始');
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    console.log('ファイルのデコード完了:', audioBuffer);
    
    // アナライザーノードの初期化
    if (!this.analyser) {
      console.log('アナライザーノードの初期化');
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.connect(this.audioContext.destination);
      console.log('アナライザーノード初期化完了:', this.analyser);
    }
    
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

  public async play() {
    try {
      if (!this.audioContext || !this.audioBuffer) {
        throw new Error('オーディオの再生に必要なリソースが初期化されていません');
      }

      console.log('再生開始');
      
      // 既存のソースノードを停止・破棄
      if (this.sourceNode) {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      }

      // 新しいソースノードを作成
      this.sourceNode = this.audioContext.createBufferSource();
      this.sourceNode.buffer = this.audioBuffer;

      // 再生終了時のハンドラを設定
      this.sourceNode.onended = () => {
        this.handlePlaybackEnd();
      };

      // アナライザーノードの設定
      if (!this.analyser) {
        console.log('アナライザーノードの初期化（再生時）');
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
      }

      // 接続: sourceNode -> analyser -> destination
      this.sourceNode.disconnect();
      this.analyser.disconnect();
      
      this.sourceNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      console.log('オーディオノードの接続完了');

      // 再生開始
      this.sourceNode.start(0, this.startOffset);
      this.startTime = this.audioContext.currentTime;
      this.isPlaying = true;

      // 定期的な状態更新を開始
      this.startStateUpdates();

      this.notifyStateChange();
      console.log('再生開始完了');
    } catch (error) {
      this.handlePlaybackError(error);
      throw error;
    }
  }

  public pause() {
    try {
      if (!this.sourceNode || !this.isPlaying) return;

      // 現在の再生位置を保存
      this.startOffset = this.getCurrentTime();

      // ソースノードを停止
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;

      // 再生状態を更新
      this.isPlaying = false;

      // 定期的な状態更新を停止
      this.stopStateUpdates();

      // 状態変更を通知
      this.notifyStateChange();
    } catch (error) {
      console.error('一時停止中にエラーが発生しました:', error);
      this.handlePlaybackError(error);
    }
  }

  public stop() {
    if (!this.sourceNode) return;

    // 定期的な状態更新を停止
    this.stopStateUpdates();

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

    // 範囲内に収める
    this.startOffset = Math.max(0, Math.min(timeSec, this.getDuration()));
    
    // 状態変更を通知
    this.notifyStateChange();

    // 再生中だった場合は再開
    if (wasPlaying) {
      this.play();
    }
  }

  /**
   * 現在の再生位置を取得
   */
  public getCurrentTime(): number {
    if (!this.audioContext) return this.startOffset;

    if (this.isPlaying) {
      // 再生中は現在時刻を計算
      const elapsed = this.audioContext.currentTime - this.startTime;
      const currentTime = this.startOffset + elapsed;
      
      // 再生終了時の処理
      const duration = this.getDuration();
      if (currentTime >= duration) {
        // 即座に停止して終端に移動
        this.stop();
        this.startOffset = 0;
        return 0;
      }
      
      return currentTime;
    }

    // 停止中は保存された位置を返す
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
    // 定期的な状態更新を停止
    this.stopStateUpdates();

    // 再生を停止
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (error) {
        console.warn('ソースノードの停止中にエラーが発生しました:', error);
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    // アナライザーノードの解放
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    // AudioContextの解放
    if (this.audioContext) {
      this.audioContext.close().catch(error => {
        console.warn('AudioContextのクローズ中にエラーが発生しました:', error);
      });
      this.audioContext = null;
    }

    // 状態のリセット
    this.audioBuffer = null;
    this.isPlaying = false;
    this.startOffset = 0;
    this.startTime = 0;
    this.stateChangeListeners = [];
  }

  /**
   * 再生終了時の処理
   */
  private handlePlaybackEnd(): void {
    // 再生状態をリセット
    this.isPlaying = false;
    this.startOffset = 0;
    this.startTime = 0;

    // ソースノードをクリーンアップ
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    // 定期的な状態更新を停止
    this.stopStateUpdates();

    // 状態変更を通知
    this.notifyStateChange();

    // 自動的に再生を再開
    if (this.audioBuffer) {
      this.play().catch(error => {
        console.error('再生の再開に失敗しました:', error);
      });
    }
  }

  // 追加: 定期的な状態更新を開始
  private startStateUpdates(): void {
    this.stopStateUpdates();  // 既存の更新があれば停止
    this.updateInterval = window.setInterval(() => {
      if (this.isPlaying) {
        this.notifyStateChange();
      }
    }, 16.67);  // 約60FPSで更新
  }

  // 追加: 定期的な状態更新を停止
  private stopStateUpdates(): void {
    if (this.updateInterval !== null) {
      window.clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private handlePlaybackError(error: unknown) {
    this.isPlaying = false;
    this.notifyStateChange();
    const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
    console.error('AudioPlaybackService エラー:', errorMessage);
  }
}

export interface AudioPlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isSuspended: boolean;
}