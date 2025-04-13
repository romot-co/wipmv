// src/core/workers/encodeWorker.ts
import { MP4Muxer } from '../MP4Muxer';
import { EncoderConfig } from '../VideoEncoderService'; // 型定義をインポート

let videoEncoder: VideoEncoder | null = null;
let audioEncoder: AudioEncoder | null = null;
let muxer: MP4Muxer | null = null;
let currentConfig: EncoderConfig | null = null;
let isInitialized = false;
let lastVideoTimestamp = 0;
let lastAudioTimestamp = 0;
let frameInterval = 0;
let samplesPerFrame = 0;
let isCancelled = false;

interface WorkerInitializeMessage {
  type: 'initialize';
  config: EncoderConfig;
}

interface WorkerEncodeVideoMessage {
  type: 'encodeVideo';
  bitmap: ImageBitmap;
  frameIndex: number;
}

interface WorkerEncodeAudioMessage {
  type: 'encodeAudio';
  channelData: Float32Array;
  frameIndex: number;
  numberOfChannels: number;
  sampleRate: number; // AudioData 作成に必要
  sampleCount: number; // AudioData 作成に必要
}

interface WorkerFinalizeMessage {
  type: 'finalize';
}

interface WorkerCancelMessage {
  type: 'cancel';
}

type WorkerIncomingMessage = 
  | WorkerInitializeMessage
  | WorkerEncodeVideoMessage
  | WorkerEncodeAudioMessage
  | WorkerFinalizeMessage
  | WorkerCancelMessage;

// --- メインスレッドへのメッセージ --- 
interface WorkerProgressMessage {
  type: 'progress';
  processedFrames: number;
  totalFrames: number; // これはメインスレッドから渡してもらう必要があるかも
}

interface WorkerResultMessage {
  type: 'result';
  data: Uint8Array;
}

interface WorkerErrorMessage {
  type: 'error';
  message: string;
}

type WorkerOutgoingMessage = 
  | WorkerProgressMessage 
  | WorkerResultMessage 
  | WorkerErrorMessage;

// Export types for main thread usage
export type {
    WorkerIncomingMessage,
    WorkerOutgoingMessage,
    WorkerInitializeMessage,
    WorkerEncodeVideoMessage,
    WorkerEncodeAudioMessage,
    WorkerFinalizeMessage,
    WorkerCancelMessage,
    WorkerProgressMessage,
    WorkerResultMessage,
    WorkerErrorMessage,
};

self.onmessage = async (event: MessageEvent<WorkerIncomingMessage>) => {
  const message = event.data;
  console.log('[Worker] Received message:', message.type);

  try {
    if (message.type === 'cancel') {
      isCancelled = true;
      // TODO: 実行中のエンコード処理があれば中断する
      console.log('[Worker] Cancel requested');
      // 必要であればエンコーダー等を閉じる
      videoEncoder?.close();
      audioEncoder?.close();
      return;
    }

    if (message.type === 'initialize') {
      isCancelled = false;
      currentConfig = message.config;
      frameInterval = Math.floor(1_000_000 / currentConfig.frameRate);
      samplesPerFrame = Math.floor(currentConfig.sampleRate / currentConfig.frameRate);
      lastVideoTimestamp = 0;
      lastAudioTimestamp = 0;

      // ★ VideoEncoderService の initialize ロジックをここに移動
      muxer = new MP4Muxer(
        { width: currentConfig.width, height: currentConfig.height }, 
        { sampleRate: currentConfig.sampleRate, channels: currentConfig.channels }
      );

      videoEncoder = new VideoEncoder({
        output: (chunk, meta) => muxer?.addVideoChunk(chunk, meta),
        error: (e) => { 
          console.error('[Worker] VideoEncoder error:', e);
          self.postMessage({ type: 'error', message: e.message });
        }
      });
      await videoEncoder.configure({
        codec: 'avc1.42001f',
        width: currentConfig.width,
        height: currentConfig.height,
        bitrate: currentConfig.videoBitrate,
        framerate: currentConfig.frameRate,
      });

      audioEncoder = new AudioEncoder({
        output: (chunk, meta) => muxer?.addAudioChunk(chunk, meta),
        error: (e) => { 
          console.error('[Worker] AudioEncoder error:', e);
          self.postMessage({ type: 'error', message: e.message });
        }
      });
      await audioEncoder.configure({
        codec: 'mp4a.40.2',
        sampleRate: currentConfig.sampleRate,
        numberOfChannels: currentConfig.channels,
        bitrate: currentConfig.audioBitrate,
      });
      
      isInitialized = true;
      console.log('[Worker] Initialized');

    } else if (message.type === 'encodeVideo') {
      if (!isInitialized || !videoEncoder || isCancelled || !currentConfig) return;
      const timestampUs = message.frameIndex * frameInterval;
      if (timestampUs < lastVideoTimestamp) return; // Monotonic check
      lastVideoTimestamp = timestampUs;

      const frame = new VideoFrame(message.bitmap, { 
        timestamp: timestampUs,
        duration: frameInterval 
      });
      videoEncoder.encode(frame);
      frame.close();
      message.bitmap.close(); // Bitmap も閉じる
      // TODO: 進捗を通知 (例: 10フレームごと)
      if (message.frameIndex % 10 === 0) {
         // self.postMessage({ type: 'progress', processedFrames: message.frameIndex });
      }

    } else if (message.type === 'encodeAudio') {
      if (!isInitialized || !audioEncoder || isCancelled || !currentConfig) return;
      const timestampUs = message.frameIndex * frameInterval;
      if (timestampUs < lastAudioTimestamp) return; // Monotonic check
      lastAudioTimestamp = timestampUs;
      
      const audioData = new AudioData({
        format: 'f32',
        sampleRate: message.sampleRate,
        numberOfChannels: message.numberOfChannels,
        numberOfFrames: message.sampleCount, // ここは sampleCount が正しいはず
        timestamp: timestampUs,
        data: message.channelData, // channelData はインターリーブ済み想定
      });
      audioEncoder.encode(audioData);
      // audioData.close(); // AudioData に close はない？
      
    } else if (message.type === 'finalize') {
      if (!isInitialized || isCancelled) return;
      console.log('[Worker] Finalizing...');

      await videoEncoder?.flush();
      await audioEncoder?.flush();
      videoEncoder?.close();
      audioEncoder?.close();

      const result = muxer?.finalize();
      if (result) {
        console.log('[Worker] Finalized. Sending result.');
        self.postMessage({ type: 'result', data: result }, { transfer: [result.buffer] });
      } else {
         self.postMessage({ type: 'error', message: 'Muxer finalize failed' });
      }
      isInitialized = false; // 完了したらリセット
    }

  } catch (error: any) {
    console.error('[Worker] Error:', error);
    self.postMessage({ type: 'error', message: error.message || 'Unknown worker error' });
    isInitialized = false; // エラー時もリセット
    videoEncoder?.close();
    audioEncoder?.close();
  }
}; 