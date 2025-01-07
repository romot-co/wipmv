import { useRef, ChangeEvent } from 'react';

interface BackgroundImageUploaderProps {
  onImageUpload: (image: HTMLImageElement) => void;
  className?: string;
}

export const BackgroundImageUploader = ({ onImageUpload, className = '' }: BackgroundImageUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      alert('画像が選択されていません');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const image = new Image();
      image.onload = () => {
        onImageUpload(image);
      };
      image.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={className}>
      <label className="block">
        <span className="text-gray-700">背景画像:</span>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="mt-1 block w-full"
        />
      </label>
    </div>
  );
}; 