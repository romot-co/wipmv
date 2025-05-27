// src/core/VideoEncoderService.ts

import { WebCodecsEncoder, type EncoderConfig as WCEncoderConfig } from 'webcodecs-encoder';
import { AppError, ErrorType, ErrorMessages } from './types/error';
import { Disposable } from './types/base';

/**
 * VideoEncoderServiceの設定
 */
export interface EncoderConfig {
  width: number;
  height: number;
  frameRate: number;
  videoBitrate: number;
  audioBitrate: number;
  sampleRate: number;
  channels: number;
  // webcodecs-encoder対応の追加設定
  codec?: {
    video?: 'avc' | 'hevc' | 'vp8' | 'vp9' | 'av1';
    audio?: 'aac' | 'opus';
  };
  container?: 'mp4' | 'webm';
  latencyMode?: 'quality' | 'realtime';
  hardwareAcceleration?: 'no-preference' | 'prefer-hardware' | 'prefer-software';
  codecString?: {
    video?: string;
    audio?: string;
  };
  audioEncoderConfig?: {
    bitrateMode?: 'constant' | 'variable';
  };
}

export type ProgressCallback = (processedFrames: number, totalFrames: number) => void;

/**
 * webcodecs-encoderを使用した動画エンコードサービス
 */
export class VideoEncoderService implements Disposable {
  private encoder: WebCodecsEncoder | null = null;
  private config: EncoderConfig;
  private isCancelled: boolean = false;
  private isDisposed: boolean = false;
  private isInitialized: boolean = false;
  private onProgress: ProgressCallback | null = null;
  private totalFrames: number = 0;
  private processedFrames: number = 0;
  // 共有AudioContext（メモリリーク防止）
  private static audioContext: AudioContext | null = null;

  constructor(config: EncoderConfig) {
    this.config = config;
  }

  /**
   * 共有AudioContextの取得（静的メソッド）
   */
  private static getAudioContext(): AudioContext {
    if (!VideoEncoderService.audioContext || VideoEncoderService.audioContext.state === 'closed') {
      try {
        VideoEncoderService.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.warn('Created new AudioContext:', VideoEncoderService.audioContext.state);
      } catch (error) {
        console.warn('Failed to create AudioContext:', error);
        throw new Error('AudioContext creation failed');
      }
    }
    return VideoEncoderService.audioContext;
  }

  /**
   * エンコードをキャンセル
   */
  public cancel(): void {
    if (this.isDisposed || this.isCancelled) return;
    console.warn('VideoEncoderService: Cancelling...');
    this.isCancelled = true;
    
    if (this.encoder) {
      this.encoder.cancel();
    }
    
    this.dispose();
  }

  /**
   * キャンセル状態をチェック
   */
  private checkCancellation(): void {
    if (this.isCancelled) {
      throw new AppError(
        ErrorType.EXPORT_CANCELLED,
        ErrorMessages[ErrorType.EXPORT_CANCELLED]
      );
    }
  }

  /**
   * リソースの状態チェック
   */
  private checkDisposed(): void {
    if (this.isDisposed) {
      throw new AppError(
        ErrorType.EXPORT_INIT_FAILED,
        'エンコーダーは既に破棄されています'
      );
    }
  }

  /**
   * エンコーダーを初期化
   */
  public async initialize(onProgress?: ProgressCallback, totalFrames?: number): Promise<void> {
    this.checkDisposed();
    this.checkCancellation();

    if (this.isInitialized) {
      console.warn("VideoEncoderService already initialized.");
      return;
    }

    this.onProgress = onProgress ?? null;
    this.totalFrames = totalFrames ?? 0;
    this.processedFrames = 0;

    try {
      // webcodecs-encoder 0.1.0に最適化された設定
      const encoderConfig: WCEncoderConfig = {
        width: this.config.width,
        height: this.config.height,
        frameRate: this.config.frameRate,
        videoBitrate: Math.min(this.config.videoBitrate, 20000000), // 20Mbps制限
        audioBitrate: Math.min(this.config.audioBitrate, 320000),   // 320kbps制限
        sampleRate: this.config.sampleRate,
        channels: Math.min(this.config.channels, 2), // ステレオ制限
        codec: {
          video: this.config.codec?.video || 'avc', // H.264推奨
          audio: this.config.codec?.audio || 'aac'  // AAC推奨
        },
        latencyMode: this.config.latencyMode || 'quality',
        hardwareAcceleration: this.config.hardwareAcceleration || 'no-preference',
        codecString: {
          video: this.config.codecString?.video,
          audio: this.config.codecString?.audio
        },
        audioEncoderConfig: {
          bitrateMode: this.config.audioEncoderConfig?.bitrateMode || 'constant'
        }
      };

      console.warn('VideoEncoderService: Initializing with config:', {
        resolution: `${encoderConfig.width}x${encoderConfig.height}`,
        frameRate: encoderConfig.frameRate,
        videoBitrate: `${Math.round(encoderConfig.videoBitrate / 1000000)}Mbps`,
        audioBitrate: `${Math.round(encoderConfig.audioBitrate / 1000)}kbps`,
        codec: encoderConfig.codec
      });

      // エンコーダーを作成
      this.encoder = new WebCodecsEncoder(encoderConfig);

      // 初期化オプション（webcodecs-encoder制限対応）
      const initOptions = {
        onProgress: (processed: number, total?: number) => {
          if (this.isCancelled) return; // キャンセル時は処理しない
          
          this.processedFrames = processed;
          if (this.onProgress) {
            this.onProgress(processed, total ?? this.totalFrames);
          }
        },
        onError: (error: any) => {
          if (this.isCancelled) return; // キャンセル時はエラー処理をスキップ
          
          console.warn('WebCodecsEncoder error:', error);
          throw new AppError(
            ErrorType.EXPORT_ENCODE_FAILED,
            `webcodecs-encoderエラー: ${error.message || error}\n\n一般的な解決策:\n• 音声ファイルを短くする\n• 解像度やビットレートを下げる\n• H.264 + AAC設定を使用`
          );
        },
        totalFrames: this.totalFrames
      };

      await this.encoder.initialize(initOptions);
      this.isInitialized = true;
      console.warn('VideoEncoderService: Successfully initialized with webcodecs-encoder v0.1.0');

    } catch (error: unknown) {
      console.warn('Failed to initialize VideoEncoderService:', error);
      this.dispose();
      
      // webcodecs-encoder固有のエラーメッセージ
      if (error instanceof Error) {
        if (error.message.includes('WebCodecs')) {
          throw new AppError(
            ErrorType.EXPORT_INIT_FAILED,
            `WebCodecs APIが利用できません。\n\n対処法:\n• Chrome/Edge (バージョン94以降) を使用\n• ブラウザでWebCodecs機能が有効か確認\n• HTTPSまたはlocalhostで実行`,
            error
          );
        }
        if (error.message.includes('codec') || error.message.includes('format')) {
          throw new AppError(
            ErrorType.EXPORT_INIT_FAILED,
            `コーデック設定エラー。\n\n推奨設定:\n• 映像: H.264 (AVC)\n• 音声: AAC\n• コンテナ: MP4`,
            error
          );
        }
      }
      
      throw new AppError(
        ErrorType.EXPORT_INIT_FAILED,
        `エンコーダーの初期化に失敗しました。\n\nエラー: ${error instanceof Error ? error.message : String(error)}\n\n対処法:\n• ブラウザを再起動\n• 設定を初期値に戻す`,
        error
      );
    }
  }

  /**
   * 動画フレームをエンコード
   */
  public async encodeVideoFrame(canvas: HTMLCanvasElement, frameIndex: number): Promise<void> {
    this.checkDisposed();
    this.checkCancellation();
    
    if (!this.isInitialized || !this.encoder) {
      console.warn("Encoder not initialized, skipping video frame encoding.");
      return;
    }

    try {
      // webcodecs-encoderのaddCanvasFrameメソッドを使用
      await this.encoder.addCanvasFrame(canvas);
      
      // 進捗更新（フレームベース）
      this.processedFrames = frameIndex + 1;
      if (this.onProgress) {
        this.onProgress(this.processedFrames, this.totalFrames);
      }

    } catch (error: unknown) {
      console.warn('Error encoding video frame:', error);
      throw new AppError(
        ErrorType.EXPORT_RENDER_FAILED,
        ErrorMessages[ErrorType.EXPORT_RENDER_FAILED] || 'Failed to encode video frame',
        error
      );
    }
  }

  /**
   * 音声バッファをエンコード（webcodecs-encoder制限対応版）
   */
  public async encodeAudioBuffer(
    audioBuffer: AudioBuffer,
    _frameIndex: number
  ): Promise<void> {
    this.checkDisposed();
    this.checkCancellation();

    if (!this.isInitialized || !this.encoder) {
      throw new AppError(
        ErrorType.EXPORT_ENCODE_FAILED,
        'エンコーダーが初期化されていません'
      );
    }

    try {
      console.warn('VideoEncoderService: Encoding audio buffer');
      const totalLength = audioBuffer.length;
      const duration = audioBuffer.duration;
      
      // webcodecs-encoder 0.1.0の制限を考慮した保守的な設定
      const maxSampleLength = 48000; // 1秒分（48kHz想定）- より保守的
      const maxDuration = 300; // 5分の制限
      
      // 長すぎる音声の事前チェック
      if (duration > maxDuration) {
        throw new AppError(
          ErrorType.EXPORT_ENCODE_FAILED,
          `音声ファイルが長すぎます（${Math.round(duration)}秒）。webcodecs-encoderの制限により、${maxDuration}秒以下の音声ファイルを使用してください。`
        );
      }
      
      if (totalLength > maxSampleLength) {
        // 大きなバッファを分割処理
        const chunkCount = Math.ceil(totalLength / maxSampleLength);
        console.warn(`Splitting large audio buffer into ${chunkCount} chunks (webcodecs-encoder limitation)`);
        
        // チャンク数の制限チェック
        if (chunkCount > 300) { // 約5分相当
          throw new AppError(
            ErrorType.EXPORT_ENCODE_FAILED,
            `音声ファイルのチャンク数が多すぎます（${chunkCount}チャンク）。webcodecs-encoderの制限により、より短い音声ファイルを使用してください。`
          );
        }
        
        for (let i = 0; i < chunkCount; i++) {
          this.checkCancellation();
          
          // エンコーダーの状態を確認
          if (!this.encoder) {
            throw new Error('Encoder became unavailable during audio processing');
          }
          
          const offset = i * maxSampleLength;
          const chunkLength = Math.min(maxSampleLength, totalLength - offset);
          
          try {
            const chunkBuffer = this.createAudioBufferChunk(audioBuffer, offset, chunkLength);
            await this.encoder.addAudioBuffer(chunkBuffer);
            console.warn(`Processed audio chunk ${i + 1}/${chunkCount}: ${offset + chunkLength}/${totalLength} samples`);
          } catch (chunkError) {
            console.warn(`Error processing audio chunk ${i + 1}:`, chunkError);
            
            // webcodecs-encoderのエラー状態を検出
            if (chunkError instanceof Error && 
                (chunkError.message.includes('state \'error\'') || 
                 chunkError.message.includes('Cannot add audio buffer in state'))) {
              throw new AppError(
                ErrorType.EXPORT_ENCODE_FAILED,
                `オーディオエンコーダーがエラー状態になりました（チャンク${i + 1}/${chunkCount}）。\n\n考えられる原因：\n• 音声ファイルが大きすぎる\n• 音声データが破損している\n• ブラウザのWebCodecs制限\n\n対処法：\n• より短い音声ファイルを使用\n• 別のブラウザを試す\n• 音声品質設定を下げる`,
                chunkError
              );
            }
            
            // その他のエラーは直接リスロー（小さなチャンクでのリトライはしない）
            throw new AppError(
              ErrorType.EXPORT_ENCODE_FAILED,
              `音声チャンク${i + 1}の処理に失敗しました。音声ファイルを短くするか、別の音声ファイルを試してください。`,
              chunkError
            );
          }
          
          // チャンク間で待機（webcodecs-encoderの負荷軽減）
          if (i < chunkCount - 1) {
            await new Promise(resolve => setTimeout(resolve, 10)); // 少し長めの待機
          }
        }
      } else {
        // 小さなバッファはそのまま処理
        await this.encoder.addAudioBuffer(audioBuffer);
        console.warn('Processed single audio buffer directly');
      }

    } catch (error: unknown) {
      console.warn('Error encoding audio buffer:', error);
      
      // AppErrorの場合はそのまま再スロー
      if (error instanceof AppError) {
        throw error;
      }
      
      // webcodecs-encoderの状態エラーの場合
      if (error instanceof Error && 
          (error.message.includes('state \'error\'') || 
           error.message.includes('Cannot add audio buffer in state'))) {
        throw new AppError(
          ErrorType.EXPORT_ENCODE_FAILED,
          'webcodecs-encoderが不正な状態になりました。\n\n一般的な解決策：\n• ページを再読み込み\n• より短い音声ファイルを使用\n• 異なるコーデック設定を試す（H.264 + AAC推奨）',
          error
        );
      }
      
      // メモリ不足の場合
      if (error instanceof Error && 
          (error.message.includes('allocation failed') || 
           error.message.includes('out of memory') ||
           error.message.includes('memory'))) {
        throw new AppError(
          ErrorType.EXPORT_ENCODE_FAILED,
          '音声データのメモリ不足です。\n\n対処法：\n• より短い音声ファイルを使用\n• 音質設定を下げる（ビットレート、サンプルレート）\n• 他のタブやアプリケーションを閉じる',
          error
        );
      }
      
      throw new AppError(
        ErrorType.EXPORT_ENCODE_FAILED,
        `音声エンコード処理に失敗しました。\n\nエラー: ${error instanceof Error ? error.message : String(error)}\n\n対処法：\n• 音声ファイルのサイズや長さを確認\n• 異なるファイル形式を試す\n• ブラウザを再起動`,
        error
      );
    }
  }

  /**
   * AudioBufferの一部を新しいAudioBufferとして作成（修正版）
   */
  private createAudioBufferChunk(
    originalBuffer: AudioBuffer,
    offset: number,
    length: number
  ): AudioBuffer {
    try {
      // 共有AudioContextを使用（メモリリーク防止）
      const audioContext = VideoEncoderService.getAudioContext();
      
      // AudioContextの状態をチェック
      if (audioContext.state === 'closed') {
        throw new Error('AudioContext is closed');
      }
      
      const chunkBuffer = audioContext.createBuffer(
        originalBuffer.numberOfChannels,
        length,
        originalBuffer.sampleRate
      );

      // 各チャンネルのデータをコピー
      for (let channel = 0; channel < originalBuffer.numberOfChannels; channel++) {
        const originalData = originalBuffer.getChannelData(channel);
        const chunkData = chunkBuffer.getChannelData(channel);
        
        // 効率的なデータコピー
        const endIndex = Math.min(offset + length, originalData.length);
        for (let i = 0; i < length; i++) {
          const sourceIndex = offset + i;
          chunkData[i] = sourceIndex < endIndex ? originalData[sourceIndex] : 0;
        }
      }

      return chunkBuffer;
    } catch (error) {
      console.warn('Error creating audio buffer chunk:', error);
      throw new Error(`Failed to create audio buffer chunk: ${error}`);
    }
  }

  /**
   * エンコードを終了してMP4データを取得
   */
  public async finalize(): Promise<Uint8Array> {
    this.checkDisposed();
    this.checkCancellation();

    if (!this.isInitialized || !this.encoder) {
      throw new AppError(
        ErrorType.EXPORT_FINALIZE_FAILED,
        'エンコーダーが初期化されていません'
      );
    }

    try {
      console.warn('VideoEncoderService: Finalizing...');
      console.warn('[DEBUG] Before calling this.encoder.finalize()');
      const result = await this.encoder.finalize();
      console.warn('[DEBUG] After calling this.encoder.finalize()', result ? 'Result received' : 'Result is null/undefined');
      
      if (!result) {
        console.warn('[DEBUG] Finalize result is empty. Throwing error.');
        throw new AppError(
          ErrorType.EXPORT_FINALIZE_FAILED,
          'エンコード結果が空です'
        );
      }

      console.warn('VideoEncoderService: Finalized successfully');
      return result;

    } catch (error: unknown) {
      console.warn('Error finalizing encoder:', error);
      console.warn('[DEBUG] Error caught in finalize:', error);
      // エラーオブジェクトの内容をより詳細に出力
      if (error instanceof Error) {
        console.warn('[DEBUG] Finalize error name:', error.name);
        console.warn('[DEBUG] Finalize error message:', error.message);
        console.warn('[DEBUG] Finalize error stack:', error.stack);
      } else {
        console.warn('[DEBUG] Finalize error is not an Error instance:', String(error));
      }
      throw new AppError(
        ErrorType.EXPORT_FINALIZE_FAILED,
        ErrorMessages[ErrorType.EXPORT_FINALIZE_FAILED],
        error
      );
    } finally {
      console.warn('[DEBUG] Finalize finally block. Calling dispose.');
      this.dispose();
    }
  }

  /**
   * リソースの解放
   */
  public dispose(): void {
    if (this.isDisposed) return;
    
    console.warn('VideoEncoderService: Disposing...');
    this.isDisposed = true;
    
    if (this.encoder) {
      this.encoder.cancel(); // webcodecs-encoderのcancelメソッドを呼び出し
      this.encoder = null;
    }
    
    this.onProgress = null;
    this.isInitialized = false;
  }

  /**
   * 静的メソッド：共有AudioContextのクリーンアップ
   */
  public static cleanupAudioContext(): void {
    if (VideoEncoderService.audioContext) {
      VideoEncoderService.audioContext.close();
      VideoEncoderService.audioContext = null;
    }
  }
}