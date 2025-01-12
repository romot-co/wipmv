import { useCallback, useRef, useState, useEffect } from 'react';

interface AudioDataState {
  waveformData: Float32Array;
  frequencyData: Uint8Array;
  error: Error | null;
  isProcessing: boolean;
  updateAudioData: (audioBuffer: AudioBuffer) => void;
}

/**
 * オーディオデータを処理するフック
 * 波形データとスペクトラムデータを提供する
 */
export const useAudioData = (): AudioDataState => {
  const [waveformData, setWaveformData] = useState<Float32Array>(new Float32Array());
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array());
  const [error, setError] = useState<Error | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // AudioContextのクリーンアップ
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const updateAudioData = useCallback((audioBuffer: AudioBuffer) => {
    try {
      setIsProcessing(true);
      setError(null);

      // 前のAudioContextをクリーンアップ
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyser);

      // 波形データの取得
      const waveform = new Float32Array(analyser.frequencyBinCount);
      analyser.getFloatTimeDomainData(waveform);
      setWaveformData(waveform);

      // スペクトラムデータの取得
      const frequency = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(frequency);
      setFrequencyData(frequency);

      // 前のAnalyserNodeをクリーンアップ
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
      analyserRef.current = analyser;

      setIsProcessing(false);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to process audio data'));
      setIsProcessing(false);
    }
  }, []);

  return {
    waveformData,
    frequencyData,
    error,
    isProcessing,
    updateAudioData,
  };
}; 