import React from 'react';
import { AudioPlaybackService } from '../core/AudioPlaybackService';
import './AudioUploader.css';

interface AudioUploaderProps {
  audioService: AudioPlaybackService;
  onAudioLoad: () => void;
  onError?: (error: Error) => void;
}

/**
 * オーディオファイルアップローダーコンポーネント
 * - ファイル選択
 * - デコード処理
 * - エラーハンドリング
 */
export const AudioUploader: React.FC<AudioUploaderProps> = ({ 
  audioService, 
  onAudioLoad,
  onError 
}) => {
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await audioService.decodeFile(file);
      onAudioLoad();
    } catch (error) {
      console.error('Failed to decode audio file:', error);
      onError?.(error instanceof Error ? error : new Error('オーディオファイルの読み込みに失敗しました'));
    }
  };

  return (
    <div className="audio-uploader">
      <input
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="file-input"
      />
    </div>
  );
}; 