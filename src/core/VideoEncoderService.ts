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
      // webcodecs-encoder設定を準備
      const encoderConfig: WCEncoderConfig = {
        width: this.config.width,
        height: this.config.height,
        frameRate: this.config.frameRate,
        videoBitrate: this.config.videoBitrate,
        audioBitrate: this.config.audioBitrate,
        sampleRate: this.config.sampleRate,
        channels: this.config.channels,
        codec: {
          video: this.config.codec?.video || 'avc',
          audio: this.config.codec?.audio || 'aac'
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

      // エンコーダーを作成
      this.encoder = new WebCodecsEncoder(encoderConfig);

      // 初期化オプション（プログレス処理を簡素化）
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
            `エンコードエラー: ${error.message || error}`
          );
        },
        totalFrames: this.totalFrames
      };

      await this.encoder.initialize(initOptions);
      this.isInitialized = true;
      console.warn('VideoEncoderService: Initialized with webcodecs-encoder');

    } catch (error: unknown) {
      console.warn('Failed to initialize VideoEncoderService:', error);
      this.dispose();
      throw new AppError(
        ErrorType.EXPORT_INIT_FAILED,
        ErrorMessages[ErrorType.EXPORT_INIT_FAILED],
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
   * 音声バッファをエンコード（分割処理対応・改善版）
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
      const maxSampleLength = 96000; // 2秒分（48kHz想定）
      
      if (totalLength > maxSampleLength) {
        // 大きなバッファを分割処理
        const chunkCount = Math.ceil(totalLength / maxSampleLength);
        console.warn(`Splitting large audio buffer into ${chunkCount} chunks`);
        
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
            
            // エンコーダーがエラー状態になった場合の特別な処理
            if (chunkError instanceof Error && 
                (chunkError.message.includes('state \'error\'') || 
                 chunkError.message.includes('Cannot add audio buffer in state'))) {
              throw new AppError(
                ErrorType.EXPORT_ENCODE_FAILED,
                'オーディオエンコーダーがエラー状態になりました。音声データが大きすぎるか、コーデック設定に問題がある可能性があります。音声ファイルを短くするか、異なるコーデック設定を試してください。',
                chunkError
              );
            }
            
            // チャンクエラーの場合、さらに小さく分割を試行
            if (chunkLength > 24000) { // 0.5秒未満まで分割
              console.warn(`Retrying with smaller chunks for chunk ${i + 1}...`);
              try {
                await this.processSmallAudioChunks(audioBuffer, offset, chunkLength);
              } catch (smallChunkError) {
                // 小さなチャンクでも失敗した場合は諦める
                throw new AppError(
                  ErrorType.EXPORT_ENCODE_FAILED,
                  'オーディオデータの処理に失敗しました。音声ファイルが破損しているか、設定に問題がある可能性があります。',
                  smallChunkError
                );
              }
            } else {
              throw chunkError; // もう分割できない場合はエラーとして扱う
            }
          }
          
          // チャンク間で少し待機（メモリ解放とフリーズ防止）
          if (i < chunkCount - 1) {
            await new Promise(resolve => setTimeout(resolve, 5));
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
          'オーディオエンコーダーが不正な状態になりました。別のコーデック設定を試すか、音声ファイルのサイズを小さくしてください。',
          error
        );
      }
      
      // メモリ不足の場合は専用エラーメッセージ
      if (error instanceof Error && 
          (error.message.includes('allocation failed') || 
           error.message.includes('out of memory') ||
           error.message.includes('memory'))) {
        throw new AppError(
          ErrorType.EXPORT_ENCODE_FAILED,
          '音声データのメモリ割り当てに失敗しました。より短い音声ファイルを使用するか、音質設定を下げてください。',
          error
        );
      }
      
      throw new AppError(
        ErrorType.EXPORT_ENCODE_FAILED,
        ErrorMessages[ErrorType.EXPORT_ENCODE_FAILED] || 'Failed to encode audio buffer',
        error
      );
    }
  }

  /**
   * より小さなオーディオチャンクを処理（フォールバック処理）
   */
  private async processSmallAudioChunks(
    originalBuffer: AudioBuffer,
    startOffset: number,
    totalLength: number
  ): Promise<void> {
    // エンコーダーの状態をチェック
    if (!this.encoder) {
      throw new Error('Encoder is not available');
    }

    const smallChunkSize = 24000; // 0.5秒分（48kHz想定）
    const chunkCount = Math.ceil(totalLength / smallChunkSize);
    
    console.warn(`Processing ${chunkCount} smaller audio chunks (${smallChunkSize} samples each)`);
    
    for (let i = 0; i < chunkCount; i++) {
      this.checkCancellation();
      
      // 各チャンク処理前にエンコーダーの状態を確認
      if (!this.encoder) {
        throw new Error('Encoder became unavailable during processing');
      }
      
      try {
        const offset = startOffset + (i * smallChunkSize);
        const chunkLength = Math.min(smallChunkSize, totalLength - (i * smallChunkSize));
        
        const chunkBuffer = this.createAudioBufferChunk(originalBuffer, offset, chunkLength);
        await this.encoder.addAudioBuffer(chunkBuffer);
        
        console.warn(`Processed small audio chunk ${i + 1}/${chunkCount}`);
        
        // 小さなチャンク間でも少し待機
        if (i < chunkCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 2));
        }
      } catch (chunkError) {
        console.warn(`Error in small chunk ${i + 1}:`, chunkError);
        
        // エンコーダーがエラー状態になった場合、処理を中断
        if (chunkError instanceof Error && 
            chunkError.message.includes('state \'error\'')) {
          throw new Error('Encoder entered error state during audio processing. Audio data may be corrupted or too large.');
        }
        
        // その他のエラーもリスローして上位で処理
        throw chunkError;
      }
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