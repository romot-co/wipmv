// src/core/VideoEncoderService.ts

// import { MP4Muxer } from './MP4Muxer';
import { AppError, ErrorType, ErrorMessages } from './types/error';
import { Disposable } from './types/base';
// Import types from the worker
import {
    WorkerInitializeMessage,
    WorkerOutgoingMessage,
    WorkerEncodeVideoMessage,
    WorkerEncodeAudioMessage,
    WorkerFinalizeMessage
} from './workers/encodeWorker';

// Define and export EncoderConfig locally
export interface EncoderConfig {
  width: number;
  height: number;
  frameRate: number;
  videoBitrate: number;
  audioBitrate: number;
  sampleRate: number;
  channels: number;
}

export type ProgressCallback = (processedFrames: number, totalFrames: number) => void;

/**
 * オフラインエンコードサービス（Web Worker + WebCodecs + mp4-muxer）
 */
export class VideoEncoderService implements Disposable {
  // Remove old encoder/muxer members
  // private videoEncoder: VideoEncoder | null = null;
  // private audioEncoder: AudioEncoder | null = null;
  // private muxer: MP4Muxer | null = null;
  // private lastVideoTimestamp = 0; // State managed in worker
  // private lastAudioTimestamp = 0; // State managed in worker

  // Add worker instance
  private worker: Worker | null = null;

  private config: EncoderConfig;
  private frameInterval: number;  // Still needed for timestamp calculations if done here
  private samplesPerFrame: number; // Still needed for audio chunking if done here
  private isCancelled: boolean = false;
  private isDisposed: boolean = false;
  private isInitialized: boolean = false; // Worker initialization status
  private totalFrames: number = 0; // Should be set before starting encode

  // Promise for finalize result
  private finalizePromise: Promise<Uint8Array> | null = null;
  private resolveFinalize: ((value: Uint8Array | PromiseLike<Uint8Array>) => void) | null = null;
  private rejectFinalize: ((reason?: any) => void) | null = null;

  // Progress callback
  private onProgress: ProgressCallback | null = null;


  constructor(config: EncoderConfig) {
    this.config = config;
    // Keep these calculations if needed for message preparation, otherwise remove
    this.frameInterval = Math.floor(1_000_000 / config.frameRate);
    this.samplesPerFrame = Math.floor(config.sampleRate / config.frameRate);
  }

  /**
   * エンコードをキャンセル
   */
  public cancel(): void {
    if (this.isDisposed || this.isCancelled) return;
    console.log('VideoEncoderService: Cancelling...');
    this.isCancelled = true;
    if (this.worker) {
      // Send cancel message to worker
      this.worker.postMessage({ type: 'cancel' });
    }
    if (this.rejectFinalize) {
        // Reject the pending finalize promise if cancellation happens
        this.rejectFinalize(new AppError(
            ErrorType.EXPORT_CANCELLED,
            ErrorMessages[ErrorType.EXPORT_CANCELLED]
        ));
    }
    this.dispose(); // Clean up resources immediately
  }

  /**
   * キャンセル状態をチェック
   * @throws {AppError} キャンセルされている場合
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
   * @throws {AppError} リソースが破棄済みの場合
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
   * Worker とエンコーダーを初期化
   */
  public async initialize(onProgress?: ProgressCallback, totalFrames?: number): Promise<void> {
    this.checkDisposed();
    this.checkCancellation();

    if (this.isInitialized) {
        console.warn("VideoEncoderService already initialized.");
        return Promise.resolve();
    }

    this.onProgress = onProgress ?? null;
    this.totalFrames = totalFrames ?? 0; // Store total frames for progress calculation

    return new Promise((resolve, reject) => {
      try {
        // Instantiate the worker
        this.worker = new Worker(new URL('./workers/encodeWorker.ts', import.meta.url), {
          type: 'module' // Ensure worker can use imports/exports
        });

        // --- Worker Message Handler ---
        this.worker.onmessage = (event: MessageEvent<WorkerOutgoingMessage>) => {
          const message = event.data;
          // console.log('[Main] Received message from worker:', message.type); // Verbose log

          if (this.isDisposed) return; // Ignore messages if disposed

          switch (message.type) {
            case 'progress':
              if (this.onProgress) {
                // Pass progress info back via callback
                this.onProgress(message.processedFrames, this.totalFrames);
              }
              break;
            case 'result':
              if (this.resolveFinalize) {
                this.resolveFinalize(message.data);
                // Reset finalize promise state after resolving
                this.finalizePromise = null;
                this.resolveFinalize = null;
                this.rejectFinalize = null;
              } else {
                 console.warn("[Main] Received finalize result but no promise is pending.");
              }
              this.dispose(); // Clean up worker after successful completion
              break;
            case 'error':
              console.error('[Main] Worker reported error:', message.message);
              const error = new AppError(
                ErrorType.EXPORT_ENCODE_FAILED, // Use a specific error type
                `Worker Error: ${message.message}`
              );
              if (this.rejectFinalize) {
                this.rejectFinalize(error);
                // Reset finalize promise state after rejecting
                this.finalizePromise = null;
                this.resolveFinalize = null;
                this.rejectFinalize = null;
              } else {
                 // If error occurs before finalize was called (e.g., during init)
                 console.error("Worker error occurred, but no finalize promise was active.");
                 reject(error); // Reject the initialize promise itself
              }
               this.dispose(); // Clean up worker on error
              break;
            // Handle potential 'initialized' confirmation message from worker if needed
            // case 'initialized':
            //   this.isInitialized = true;
            //   console.log('VideoEncoderService: Worker confirmed initialization.');
            //   resolve(); // Resolve the initialize promise here
            //   break;
          }
        };

        // --- Worker Error Handler ---
        this.worker.onerror = (errorEvent) => {
           // Prevent default error handling (logging to console)
           errorEvent.preventDefault();
           console.error('[Main] Worker onerror event:', errorEvent.message, errorEvent);
           const appError = new AppError(
             ErrorType.EXPORT_INIT_FAILED, // Or a more specific worker error type
             `Worker instantiation or runtime error: ${errorEvent.message}`,
             errorEvent // Pass the original event if needed
           );
           if(this.rejectFinalize) {
               this.rejectFinalize(appError); // Reject finalize if active
           } else {
               reject(appError); // Reject initialize if finalize hasn't started
           }
           this.dispose(); // Clean up worker on critical error
        };

        // Send initialization message to worker
        const initMessage: WorkerInitializeMessage = {
          type: 'initialize',
          config: this.config
        };
        this.worker.postMessage(initMessage);

        // Assume initialization is successful immediately after posting message.
        // For robust handling, wait for an 'initialized' confirmation from worker.
        this.isInitialized = true;
        console.log('VideoEncoderService: Worker initialization message sent.');
        resolve(); // Resolve the initialize promise now

      } catch (error: unknown) {
        console.error('Failed to initialize VideoEncoderService Worker:', error);
        this.dispose(); // Ensure cleanup on initialization failure
        const appError = new AppError(
            ErrorType.EXPORT_INIT_FAILED,
            ErrorMessages[ErrorType.EXPORT_INIT_FAILED],
            error
        );
        reject(appError); // Reject the initialize promise
      }
    });
  }

  /**
   * Canvas => ImageBitmap => Worker
   */
  public async encodeVideoFrame(canvas: HTMLCanvasElement, frameIndex: number): Promise<void> {
    // Check state before proceeding
    this.checkDisposed();
    this.checkCancellation();
    if (!this.isInitialized || !this.worker) {
      console.warn("Encoder not initialized or worker missing, skipping video frame encoding.");
      // Decide if throwing an error is better than silently returning
      // throw new AppError(ErrorType.INVALID_STATE, "Encoder not ready for video frame.");
      return;
    }

    try {
      // Create ImageBitmap (async)
      const bitmap = await createImageBitmap(canvas);

      // Prepare message for worker
      const message: WorkerEncodeVideoMessage = {
          type: 'encodeVideo',
          bitmap: bitmap,
          frameIndex: frameIndex
      };

      // Send message to worker, transferring bitmap ownership
      this.worker.postMessage(message, [bitmap]);

    } catch (error: unknown) {
       console.error('Error preparing/sending video frame:', error);
       // Propagate the error to the finalize promise if it's active
       if (this.rejectFinalize) {
           this.rejectFinalize(new AppError(
               ErrorType.EXPORT_RENDER_FAILED,
               ErrorMessages[ErrorType.EXPORT_RENDER_FAILED] || 'Failed to encode video frame',
               error
           ));
       }
       // Dispose on critical error during encoding
       this.dispose();
       // Re-throw the specific error
       throw error instanceof AppError ? error : new AppError(ErrorType.EXPORT_RENDER_FAILED, 'Failed to prepare or send video frame', error);
    }
  }

  /**
   * AudioBuffer => Float32Array => Worker
   */
  public async encodeAudioBuffer(
    audioBuffer: AudioBuffer,
    frameIndex: number
  ): Promise<void> {
     // Check state before proceeding
    this.checkDisposed();
    this.checkCancellation();
     if (!this.isInitialized || !this.worker) {
      console.warn("Encoder not initialized or worker missing, skipping audio buffer encoding.");
      // throw new AppError(ErrorType.INVALID_STATE, "Encoder not ready for audio buffer.");
      return;
    }

    try {
      // Calculate sample position and count for this frame
      // Ensure samplesPerFrame is calculated correctly in constructor
      const startSample = frameIndex * this.samplesPerFrame;
      const sampleCount = Math.min(
        this.samplesPerFrame,
        audioBuffer.length - startSample
      );

      if (sampleCount <= 0) {
        // console.log(`No audio samples for frame ${frameIndex}`);
        return; // No samples for this frame index
      }

      // Prepare interleaved Float32Array
      const numberOfChannels = audioBuffer.numberOfChannels;
      // Validate config channels match buffer channels?
      if (numberOfChannels !== this.config.channels) {
           console.warn(`AudioBuffer channel count (${numberOfChannels}) differs from config (${this.config.channels}). Using buffer channels.`);
           // Potentially throw an error or adjust config? For now, proceed.
      }

      const channelData = new Float32Array(sampleCount * numberOfChannels);

      for (let ch = 0; ch < numberOfChannels; ch++) {
        // Ensure getChannelData doesn't throw for invalid channel index
        if (ch >= audioBuffer.numberOfChannels) continue;
        const sourceData = audioBuffer.getChannelData(ch);
        for (let i = 0; i < sampleCount; i++) {
          const srcIdx = startSample + i;
          if (srcIdx < sourceData.length) {
            // Clipping applied in original code, keep it. Worker might also need clipping logic?
            channelData[i * numberOfChannels + ch] = Math.max(-1, Math.min(1, sourceData[srcIdx]));
          } else {
            channelData[i * numberOfChannels + ch] = 0; // Pad with silence if source is short
          }
        }
      }

      // Prepare message for worker
      const message: WorkerEncodeAudioMessage = {
          type: 'encodeAudio',
          channelData: channelData,
          frameIndex: frameIndex,
          numberOfChannels: numberOfChannels, // Use actual channels from buffer
          sampleRate: audioBuffer.sampleRate, // Pass necessary info for AudioData creation
          sampleCount: sampleCount
      };

      // Send message to worker, transferring buffer ownership
      this.worker.postMessage(message, [channelData.buffer]);

    } catch (error: unknown) {
       console.error('Error preparing/sending audio buffer:', error);
       if (this.rejectFinalize) {
           this.rejectFinalize(new AppError(
               ErrorType.EXPORT_ENCODE_FAILED,
               ErrorMessages[ErrorType.EXPORT_ENCODE_FAILED] || 'Failed to encode audio buffer',
               error
           ));
       }
       this.dispose();
       throw error instanceof AppError ? error : new AppError(ErrorType.EXPORT_ENCODE_FAILED, 'Failed to prepare or send audio buffer', error);
    }
  }

  /**
   * Signal worker to finalize encoding and return MP4 data.
   */
  public finalize(): Promise<Uint8Array> {
    this.checkDisposed();
    this.checkCancellation(); // Check cancellation before proceeding

    if (!this.isInitialized || !this.worker) {
       console.error("Cannot finalize: Encoder not initialized or worker missing.");
      return Promise.reject(
          new AppError(ErrorType.EXPORT_FINALIZE_FAILED, 'エンコーダーが初期化されていないか、ワーカーが見つかりません')
      );
    }

    // If finalize promise already exists (e.g., called multiple times), return the existing one
    if (this.finalizePromise) {
        console.warn("Finalize already called, returning existing promise.");
        return this.finalizePromise;
    }

    // Create a new promise to await the result from the worker
    this.finalizePromise = new Promise<Uint8Array>((resolve, reject) => {
        // Store resolve/reject handlers for the message listener
        this.resolveFinalize = resolve;
        this.rejectFinalize = reject;

        // Send finalize message to worker
        console.log('VideoEncoderService: Sending finalize message to worker.');
        const message: WorkerFinalizeMessage = { type: 'finalize' };
        try {
          this.worker!.postMessage(message);
        } catch (error) {
            // Handle potential errors during postMessage itself (e.g., worker terminated)
            console.error("Error sending finalize message to worker:", error);
            reject(new AppError(ErrorType.EXPORT_FINALIZE_FAILED, "ワーカーへの finalize メッセージ送信に失敗しました", error));
            this.dispose(); // Clean up if sending fails
        }
    });

    return this.finalizePromise;
  }

  /**
   * リソースの解放
   * 以下の順序で解放を行う:
   * 1. エンコーダー（VideoEncoder, AudioEncoder）
   * 2. Muxer
   * 3. その他の状態をリセット
   */
  public dispose(): void {
    if (this.isDisposed) return;
    console.log('VideoEncoderService: Disposing...');
    this.isDisposed = true; // Mark as disposed first
    if (this.worker) {
      this.worker.terminate(); // Terminate the worker
      this.worker = null;
    }
    // Reset promise state to prevent leaks if disposed before completion/error
    if (this.rejectFinalize && !this.isCancelled) {
        // If disposed unexpectedly (not via cancel), reject the promise
        this.rejectFinalize(new AppError(ErrorType.OPERATION_ABORTED, 'Encoder disposed prematurely.'));
    }
    this.finalizePromise = null;
    this.resolveFinalize = null;
    this.rejectFinalize = null;
    this.onProgress = null; // Clear callback
    this.isInitialized = false;
    // isCancelled remains true if cancelled, false otherwise
  }
}
