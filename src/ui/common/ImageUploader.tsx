import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  onImageLoad: (dataUrl: string) => void;
  accept?: string[];
  maxSize?: number;
  className?: string;
  previewUrl?: string;
}

/**
 * 画像アップロードコンポーネント
 * ドラッグ&ドロップとファイル選択に対応
 */
export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelect,
  onImageLoad,
  accept = ['image/jpeg', 'image/png', 'image/gif'],
  maxSize = 5 * 1024 * 1024, // デフォルト5MB
  className = '',
  previewUrl,
}) => {
  const [preview, setPreview] = useState<string>(previewUrl || '');
  const [error, setError] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // ファイルサイズチェック
    if (file.size > maxSize) {
      setError(`ファイルサイズは${Math.floor(maxSize / 1024 / 1024)}MB以下にしてください`);
      return;
    }

    // プレビュー用のURLを生成
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      onImageLoad(dataUrl);
    };
    reader.onerror = () => {
      setError('画像の読み込みに失敗しました');
    };
    reader.readAsDataURL(file);

    onImageSelect(file);
    setError('');
  }, [maxSize, onImageSelect, onImageLoad]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.reduce((acc, curr) => ({ ...acc, [curr]: [] }), {}),
    maxSize,
    multiple: false,
  });

  return (
    <div className={`w-full ${className}`}>
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        `}
      >
        <input {...getInputProps()} />
        
        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt="プレビュー"
              className="max-h-48 mx-auto object-contain"
            />
            <div className="
              absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100
              flex items-center justify-center text-white transition-opacity duration-200
            ">
              クリックまたはドラッグで画像を変更
            </div>
          </div>
        ) : (
          <div className="py-8">
            {isDragActive ? (
              <p>ここにドロップしてください</p>
            ) : (
              <>
                <p>クリックまたはドラッグで画像をアップロード</p>
                <p className="text-sm text-gray-500 mt-2">
                  {accept.join(', ')} 形式、{Math.floor(maxSize / 1024 / 1024)}MB以下
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </div>
  );
}; 