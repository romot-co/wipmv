import React from 'react';

export interface ImageUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  placeholder?: string;
}

/**
 * 画像アップローダーコンポーネント
 * URL入力とファイルアップロードの両方に対応
 */
export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  value,
  onChange,
  accept = 'image/*',
  placeholder = '',
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
          <span>または</span>
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
          />
        </div>
      </label>
    </div>
  );
}; 