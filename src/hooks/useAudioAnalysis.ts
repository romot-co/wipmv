import { useState, useCallback } from 'react';
import { AudioAnalyzer } from '../services/audio/AudioAnalyzer';
import { AudioSource } from '../types';

export const useAudioAnalysis = () => {
  const [audioSource, setAudioSource] = useState<AudioSource | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const analyzeAudio = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const analyzer = new AudioAnalyzer();
      const result = await analyzer.processAudio(file);
      
      if (result) {
        setAudioSource(result);
      } else {
        throw new Error('音声の解析に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('不明なエラーが発生しました'));
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    audioSource,
    isAnalyzing,
    error,
    analyzeAudio,
  };
}; 