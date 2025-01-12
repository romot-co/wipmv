// src/hooks/useAudioSource.ts

import { useState, useCallback } from 'react';
import { AudioSource } from '../core/types';

export function useAudioSource() {
  const [audioSource, setAudioSource] = useState<AudioSource | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      // 自前の decode 処理、または AudioPlaybackService などで decode
      const audioContext = new AudioContext();
      const arrayBuffer = await file.arrayBuffer();
      const buffer = await audioContext.decodeAudioData(arrayBuffer);

      const newSource: AudioSource = {
        buffer,
        sampleRate: buffer.sampleRate,
        numberOfChannels: buffer.numberOfChannels,
        duration: buffer.duration,
        fileName: file.name
      };
      setAudioSource(newSource);

      audioContext.close();
    } catch (e) {
      console.error('Failed to load audio:', e);
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    audioSource,
    isLoading,
    error,
    loadFile
  };
}