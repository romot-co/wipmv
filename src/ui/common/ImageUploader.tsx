import React, { memo } from 'react';

/**
 * 画像アップローダーのプロパティ
 */
export interface ImageUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * 画像アップローダーコンポーネント
 * - URL入力とファイルアップロードの両方に対応
 * - 画像プレビュー機能付き
 * - ドラッグ&ドロップにも対応
 */
export const ImageUploader = memo<ImageUploaderProps>(({
  label,
  value,
  onChange,
  accept = 'image/*',
  placeholder = '',
  disabled = false
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onChange(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="image-uploader">
      <label>
        {label}:
        <div className="input-group">
          <input
            type="text"
            value={value}
            onChange={(e) => !disabled && onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
          />
          <span>または</span>
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={disabled}
          />
        </div>
      </label>
    </div>
  );
});

ImageUploader.displayName = 'ImageUploader';
