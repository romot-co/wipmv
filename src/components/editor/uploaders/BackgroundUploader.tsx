import React, { useCallback } from 'react';

interface BackgroundUploaderProps {
  onImageUpload: (image: HTMLImageElement) => void;
  className?: string;
}

export const BackgroundUploader: React.FC<BackgroundUploaderProps> = ({ onImageUpload, className }) => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const image = new Image();
      image.onload = () => {
        onImageUpload(image);
      };
      image.onerror = (error) => {
        console.error('画像の読み込みに失敗しました:', error);
      };
      image.src = e.target?.result as string;
    };

    reader.onerror = (error) => {
      console.error('ファイルの読み込みに失敗しました:', error);
    };

    reader.readAsDataURL(file);
  }, [onImageUpload]);

  return (
    <div className={className}>
      <h3>背景画像</h3>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100"
      />
      <p className="text-sm text-gray-600 mt-2">
        推奨: 1920x1080px以上の高解像度画像
      </p>
    </div>
  );
} 