import React, { useEffect, useRef } from 'react';
import './WaveformPreview.css';

interface WaveformPreviewProps {
  audioBuffer: AudioBuffer | null;
  currentTime: number;
  duration: number;
  onTimeUpdate: (time: number) => void;
  color?: string;
  lineWidth?: number;
}

export const WaveformPreview: React.FC<WaveformPreviewProps> = ({
  audioBuffer,
  currentTime,
  duration,
  onTimeUpdate,
  color = '#4a9eff',
  lineWidth = 1
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 波形の描画
  useEffect(() => {
    if (!canvasRef.current || !audioBuffer) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスのサイズを設定
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // 波形の描画
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / rect.width);
    const amp = rect.height / 2;

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.beginPath();
    ctx.moveTo(0, amp);

    for (let i = 0; i < rect.width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.lineTo(i, (1 + min) * amp);
      ctx.lineTo(i, (1 + max) * amp);
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }, [audioBuffer, color, lineWidth]);

  // 再生位置の描画
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const position = (currentTime / duration) * rect.width;

    // 前回の再生位置を消去
    ctx.clearRect(rect.width - 2, 0, 2, rect.height);

    // 再生位置を描画
    ctx.fillStyle = '#ff4a4a';
    ctx.fillRect(position, 0, 2, rect.height);
  }, [currentTime, duration]);

  // クリックでシーク
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / rect.width) * duration;
    onTimeUpdate(time);
  };

  return (
    <div className="waveform-preview-container">
      <canvas
        ref={canvasRef}
        className="waveform-preview"
        onClick={handleClick}
      />
    </div>
  );
}; 