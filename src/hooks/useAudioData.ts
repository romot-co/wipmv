import { useCallback, useEffect, useRef, useState } from 'react';

interface AudioDataState {
  waveformData: Float32Array;
  frequencyData: Uint8Array;
  updateAudioData: (audioBuffer: AudioBuffer) => void;
  createSourceNode: (startTime?: number) => AudioBufferSourceNode | null;
}

export function useAudioData(): AudioDataState {
  const [waveformData, setWaveformData] = useState<Float32Array>(new Float32Array(2048));
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(2048));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // AudioContextの初期化（一度だけ）
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 2048;
      analyser.connect(audioContextRef.current.destination);
      analyserRef.current = analyser;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  // ソースノードの作成（再生位置を指定可能）
  const createSourceNode = useCallback((startTime: number = 0) => {
    if (!audioContextRef.current || !analyserRef.current || !audioBufferRef.current) return null;

    // 既存のソースノードを停止
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(analyserRef.current);
    source.start(0, startTime);
    sourceNodeRef.current = source;

    return source;
  }, []);

  // オーディオデータの更新
  const updateAudioData = useCallback((audioBuffer: AudioBuffer) => {
    audioBufferRef.current = audioBuffer;
    
    // 波形データの更新
    const updateData = () => {
      if (!analyserRef.current) return;

      const waveformBuffer = new Float32Array(analyserRef.current.frequencyBinCount);
      const frequencyBuffer = new Uint8Array(analyserRef.current.frequencyBinCount);

      analyserRef.current.getFloatTimeDomainData(waveformBuffer);
      analyserRef.current.getByteFrequencyData(frequencyBuffer);

      setWaveformData(waveformBuffer);
      setFrequencyData(frequencyBuffer);

      animationFrameRef.current = requestAnimationFrame(updateData);
    };

    // 更新開始
    updateData();
  }, []);

  return {
    waveformData,
    frequencyData,
    updateAudioData,
    createSourceNode,
  };
} 