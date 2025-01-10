import React, { useState, useCallback } from 'react';
import { BackgroundEffectConfig } from '../../types/effects';
import './EffectManager.css';

interface BackgroundEffectSettingsProps {
  effect: BackgroundEffectConfig;
  onEffectChange: (effect: BackgroundEffectConfig) => void;
  isSelected: boolean;
  onSelect: () => void;
}

export const BackgroundEffectSettings: React.FC<BackgroundEffectSettingsProps> = ({
  effect,
  onEffectChange,
  isSelected,
  onSelect
}) => {
  const [isDragging, setIsDragging] = useState(false);

  // プレースホルダー画像の作成
  const createPlaceholderImage = useCallback(() => {
    const img = new Image();
    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NjY2NjYiPuODieODreODg+ODl+OBl+OBpuOBj+OBoOOBleOBhDwvdGV4dD48L3N2Zz4=';
    return new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
  }, []);

  const handleTypeChange = async (type: 'color' | 'image') => {
    if (type === 'color') {
      onEffectChange({
        type: 'color',
        color: '#000000',
        opacity: effect.opacity,
        blendMode: effect.blendMode
      });
    } else if (type === 'image') {
      try {
        // 既存の画像があればそれを使用し、なければプレースホルダーを作成
        const image = effect.type === 'image' ? effect.image : await createPlaceholderImage();
        onEffectChange({
          type: 'image',
          image,
          opacity: effect.opacity,
          blendMode: effect.blendMode
        });
      } catch (error) {
        console.error('プレースホルダー画像の作成に失敗しました:', error);
      }
    }
  };

  const handleColorChange = (color: string) => {
    if (effect.type === 'color') {
      onEffectChange({
        ...effect,
        color
      });
    }
  };

  const handleOpacityChange = (opacity: number) => {
    onEffectChange({
      ...effect,
      opacity
    });
  };

  const handleBlendModeChange = (blendMode: GlobalCompositeOperation) => {
    onEffectChange({
      ...effect,
      blendMode
    });
  };

  const handleImageDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) {
      console.warn('ドロップされたファイルは画像ではありません');
      return;
    }

    try {
      const image = new Image();
      image.src = URL.createObjectURL(file);
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });

      onEffectChange({
        type: 'image',
        image,
        opacity: effect.opacity,
        blendMode: effect.blendMode
      });
    } catch (error) {
      console.error('画像の読み込みに失敗しました:', error);
    }
  }, [effect.opacity, effect.blendMode, onEffectChange]);

  return (
    <div
      className={`background-effect-settings ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="effect-row">
        <label>タイプ:</label>
        <select
          value={effect.type}
          onChange={async (e) => await handleTypeChange(e.target.value as 'color' | 'image')}
        >
          <option value="color">カラー</option>
          <option value="image">画像</option>
        </select>
      </div>

      {effect.type === 'color' && (
        <div className="effect-row">
          <label>色:</label>
          <input
            type="color"
            value={effect.color}
            onChange={(e) => handleColorChange(e.target.value)}
          />
        </div>
      )}

      {effect.type === 'image' && (
        <div
          className={`image-drop-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleImageDrop}
        >
          {effect.image ? (
            <img
              src={effect.image.src}
              alt="背景"
              style={{ maxWidth: '100%', maxHeight: '100px' }}
            />
          ) : (
            <div className="drop-message">
              画像をドロップしてください
            </div>
          )}
        </div>
      )}

      <div className="effect-row">
        <label>不透明度:</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={effect.opacity}
          onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
        />
        <span>{Math.round(effect.opacity * 100)}%</span>
      </div>

      <div className="effect-row">
        <label>ブレンドモード:</label>
        <select
          value={effect.blendMode}
          onChange={(e) => handleBlendModeChange(e.target.value as GlobalCompositeOperation)}
        >
          <option value="source-over">通常</option>
          <option value="multiply">乗算</option>
          <option value="screen">スクリーン</option>
          <option value="overlay">オーバーレイ</option>
        </select>
      </div>
    </div>
  );
}; 