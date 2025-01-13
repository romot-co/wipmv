import { useCallback, useRef, useState } from 'react';
import { Muxer, ArrayBufferTarget, MuxerOptions } from 'mp4-muxer';

interface MP4MuxerState {
  isMuxing: boolean;
  error: Error | null;
  addVideoTrack: (width: number, height: number, codec?: string) => void;
  addAudioTrack: (codec?: string) => void;
  addVideoChunk: (chunk: EncodedVideoChunk, timestamp: number) => void;
  addAudioChunk: (chunk: EncodedAudioChunk, timestamp: number) => void;
  finalize: () => Promise<Uint8Array>;
}

/**
 * MP4マルチプレクサーを管理するフック
 * ビデオ・オーディオトラックの追加、チャンクデータの処理を行う
 */
export const useMP4Muxer = (): MP4MuxerState => {
  const muxerRef = useRef<Muxer<ArrayBufferTarget> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isMuxing, setIsMuxing] = useState(false);

  const initializeMuxer = useCallback((options: MuxerOptions<ArrayBufferTarget>) => {
    try {
      if (muxerRef.current) {
        // 既存のMuxerをクリーンアップ
        muxerRef.current = null;
      }
      const target = new ArrayBufferTarget();
      muxerRef.current = new Muxer<ArrayBufferTarget>({ ...options, target, fastStart: true });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to initialize muxer'));
    }
  }, []);

  const addVideoTrack = useCallback((width: number, height: number, codec = 'avc1.42001f') => {
    try {
      if (!muxerRef.current) {
        initializeMuxer({ width, height });
      }
      muxerRef.current?.addVideoTrack({ width, height, codec });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to add video track'));
    }
  }, [initializeMuxer]);

  const addAudioTrack = useCallback((codec = 'mp4a.40.2') => {
    try {
      if (!muxerRef.current) {
        initializeMuxer({});
      }
      muxerRef.current?.addAudioTrack({ codec });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to add audio track'));
    }
  }, [initializeMuxer]);

  const addVideoChunk = useCallback((chunk: EncodedVideoChunk, timestamp: number) => {
    try {
      if (!muxerRef.current) {
        throw new Error('Muxer not initialized');
      }
      muxerRef.current.addVideoChunk(chunk, timestamp);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to add video chunk'));
    }
  }, []);

  const addAudioChunk = useCallback((chunk: EncodedAudioChunk, timestamp: number) => {
    try {
      if (!muxerRef.current) {
        throw new Error('Muxer not initialized');
      }
      muxerRef.current.addAudioChunk(chunk, timestamp);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to add audio chunk'));
    }
  }, []);

  const finalize = useCallback(async () => {
    try {
      if (!muxerRef.current) {
        throw new Error('Muxer not initialized');
      }
      setIsMuxing(true);
      const result = await muxerRef.current.finalize();
      setIsMuxing(false);
      setError(null);
      return result;
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to finalize muxing'));
      setIsMuxing(false);
      throw e;
    }
  }, []);

  return {
    isMuxing,
    error,
    addVideoTrack,
    addAudioTrack,
    addVideoChunk,
    addAudioChunk,
    finalize,
  };
}; 