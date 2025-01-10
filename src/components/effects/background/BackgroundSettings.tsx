import React, { useState, useCallback } from 'react';
import { BackgroundEffectConfig } from '../../../types/effects';
import { BackgroundPreview } from './BackgroundPreview';
import './BackgroundSettings.css';

interface BackgroundSettingsProps {
  effect: BackgroundEffectConfig;
  onEffectChange: (effect: BackgroundEffectConfig) => void;
}

export const BackgroundSettings: React.FC<BackgroundSettingsProps> = ({
  effect,
  onEffectChange
}) => {
  const [isSelected, setIsSelected] = useState(false);

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
        ...effect,
        type: 'color',
        color: '#000000'
      });
    } else if (type === 'image') {
      try {
        const image = effect.type === 'image' ? effect.image : await createPlaceholderImage();
        onEffectChange({
          ...effect,
          type: 'image',
          image
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      onEffectChange({
        ...effect,
        type: 'image',
        image: img
      });
    } catch (error) {
      console.error('画像のアップロードに失敗しました:', error);
    }
  };

  return (
    <div className="background-settings">
      <BackgroundPreview
        effect={effect}
        isSelected={isSelected}
        onClick={() => setIsSelected(!isSelected)}
      />
      <div className="background-settings-controls">
        <div className="background-settings-control">
          <label>タイプ:</label>
          <select
            value={effect.type}
            onChange={(e) => handleTypeChange(e.target.value as 'color' | 'image')}
          >
            <option value="color">色</option>
            <option value="image">画像</option>
          </select>
        </div>
        {effect.type === 'color' && (
          <div className="background-settings-control">
            <label>色:</label>
            <input
              type="color"
              value={effect.color}
              onChange={(e) => handleColorChange(e.target.value)}
            />
          </div>
        )}
        {effect.type === 'image' && (
          <div className="background-settings-control">
            <label>画像:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>
        )}
        <div className="background-settings-control">
          <label>不透明度:</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={effect.opacity}
            onChange={(e) => handleOpacityChange(Number(e.target.value))}
          />
          <span>{Math.round(effect.opacity * 100)}%</span>
        </div>
        <div className="background-settings-control">
          <label>ブレンドモード:</label>
          <select
            value={effect.blendMode}
            onChange={(e) => handleBlendModeChange(e.target.value as GlobalCompositeOperation)}
          >
            <option value="normal">通常</option>
            <option value="multiply">乗算</option>
            <option value="screen">スクリーン</option>
            <option value="overlay">オーバーレイ</option>
          </select>
        </div>
      </div>
    </div>
  );
}; 