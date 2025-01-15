import React from 'react';
import { Button } from '@radix-ui/themes';

export interface AudioUploaderProps {
  onFileSelect: (file: File) => Promise<void>;
  onError: (error: Error) => void;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({ onFileSelect, onError }) => {
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await onFileSelect(file);
    } catch (error) {
      onError(error instanceof Error ? error : new Error('ファイルの読み込みに失敗しました'));
    }
  };

  return (
    <Button asChild>
      <label>
        オーディオファイルを選択
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </label>
    </Button>
  );
}; 