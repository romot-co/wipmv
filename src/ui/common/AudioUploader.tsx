import React from 'react';
import { Button } from '@radix-ui/themes';

export interface AudioUploaderProps {
  onFileSelect: (file: File) => Promise<void>;
  onError: (error: Error) => void;
}

// サポートする音声形式の定義
const SUPPORTED_MIME_TYPES = [
  'audio/mpeg',  // mp3
  'audio/wav',   // wav
  'audio/x-wav', // wav (別形式)
  'audio/aac',   // aac
  'audio/m4a',   // m4a
  'audio/ogg',   // ogg
  'audio/flac'   // flac
];

const SUPPORTED_EXTENSIONS = ['.mp3', '.wav', '.aac', '.m4a', '.ogg', '.flac'];

// ファイルの検証
const validateAudioFile = (file: File): { isValid: boolean; error?: string } => {
  // ファイルサイズチェック (100MB制限)
  const MAX_FILE_SIZE = 100 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: 'ファイルサイズが大きすぎます（上限: 100MB）'
    };
  }

  // MIME typeチェック
  const mimeType = file.type.toLowerCase();
  if (!SUPPORTED_MIME_TYPES.includes(mimeType)) {
    // 拡張子でのフォールバックチェック
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      return {
        isValid: false,
        error: '未対応のファイル形式です。対応形式: MP3, WAV, AAC, M4A, OGG, FLAC'
      };
    }
  }

  return { isValid: true };
};

export const AudioUploader: React.FC<AudioUploaderProps> = ({ onFileSelect, onError }) => {
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイルの検証
    const validation = validateAudioFile(file);
    if (!validation.isValid) {
      onError(new Error(validation.error));
      // 入力をクリア
      event.target.value = '';
      return;
    }

    try {
      console.log('音声ファイル選択:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      await onFileSelect(file);
    } catch (error) {
      console.error('音声ファイル処理エラー:', error);
      onError(error instanceof Error ? error : new Error('ファイルの読み込みに失敗しました'));
      // 入力をクリア
      event.target.value = '';
    }
  };

  return (
    <Button asChild>
      <label>
        オーディオファイルを選択
        <input
          type="file"
          accept={SUPPORTED_MIME_TYPES.join(',')}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </label>
    </Button>
  );
};
