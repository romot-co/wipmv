import React, { useCallback } from 'react';

interface WatermarkUploaderProps {
  onImageUpload: (image: HTMLImageElement) => void;
  className?: string;
}

export const WatermarkUploader: React.FC<WatermarkUploaderProps> = ({ onImageUpload, className }) => {
  // UTF-8文字列をBase64エンコードする関数
  const utf8ToBase64 = (str: string): string => {
    // UTF-8文字列をバイト配列に変換
    const bytes = new TextEncoder().encode(str);
    // バイト配列をBase64エンコード
    const base64 = btoa(
      Array.from(bytes)
        .map(byte => String.fromCharCode(byte))
        .join('')
    );
    return base64;
  };

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

      try {
        // SVGの場合は特別な処理
        if (file.type === 'image/svg+xml') {
          const svgContent = e.target?.result as string;
          const base64Svg = utf8ToBase64(svgContent);
          image.src = `data:image/svg+xml;base64,${base64Svg}`;
        } else {
          image.src = e.target?.result as string;
        }
      } catch (error) {
        console.error('画像の変換に失敗しました:', error);
      }
    };

    reader.onerror = (error) => {
      console.error('ファイルの読み込みに失敗しました:', error);
    };

    // SVGの場合はテキストとして読み込み、それ以外はデータURLとして読み込む
    if (file.type === 'image/svg+xml') {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  }, [onImageUpload]);

  return (
    <div className={className}>
      <h3>ウォーターマーク画像</h3>
      <input
        type="file"
        accept="image/png,image/svg+xml"
        onChange={handleFileChange}
      />
      <p className="text-sm text-gray-600">
        推奨: 透過PNG または SVGファイル
      </p>
    </div>
  );
}; 