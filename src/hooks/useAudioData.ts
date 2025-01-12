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
  const animationFrameRef = useRef<number | null>(null);

  // AudioContextのクリーンアップ
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // 波形データの更新
  const updateData = useCallback(() => {
    if (!analyserRef.current) return;

    const waveform = new Float32Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getFloatTimeDomainData(waveform);
    setWaveformData(waveform);

    const frequency = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(frequency);
    setFrequencyData(frequency);

    animationFrameRef.current = requestAnimationFrame(updateData);
  }, []);

  const updateAudioData = useCallback((audioBuffer: AudioBuffer) => {
    try {
      setIsProcessing(true);
      setError(null);

      // 前のAudioContextをクリーンアップ
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      // 前のアニメーションフレームをクリーンアップ
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      source.start(0);

      // 前のAnalyserNodeをクリーンアップ
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
      analyserRef.current = analyser;

      // データ更新の開始
      updateData();

      setIsProcessing(false);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to process audio data'));
      setIsProcessing(false);
    }
  }, [updateData]);

  return {
    waveformData,
    frequencyData,
    error,
    isProcessing,
    updateAudioData,
  };
}; 