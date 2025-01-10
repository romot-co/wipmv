import React from 'react';
import { EffectType } from '../../hooks/useEffects';
import { VisualEffectConfig } from '../../types/effects';
import './Inspector.css';

interface InspectorProps {
  selectedEffect: VisualEffectConfig | null;
  effectType: EffectType | null;
  onEffectUpdate: (type: EffectType, config: VisualEffectConfig) => void;
}

export const Inspector: React.FC<InspectorProps> = ({
  selectedEffect,
  effectType,
  onEffectUpdate
}) => {
  if (!selectedEffect || !effectType) {
    return (
      <div className="inspector">
        <div className="inspector-empty">
          要素を選択してください
        </div>
      </div>
    );
  }

  const handleChange = (field: string, value: unknown) => {
    if (field === 'type' && value === 'image') {
      const img = new Image();
      img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      onEffectUpdate(effectType, {
        ...selectedEffect,
        type: 'image',
        image: img,
        opacity: selectedEffect.opacity,
        blendMode: selectedEffect.blendMode
      });
    } else if (field === 'type' && value === 'color') {
      onEffectUpdate(effectType, {
        ...selectedEffect,
        type: 'color',
        color: '#000000',
        opacity: selectedEffect.opacity,
        blendMode: selectedEffect.blendMode
      });
    } else {
      onEffectUpdate(effectType, {
        ...selectedEffect,
        [field]: value
      });
    }
  };

  const renderBackgroundProperties = () => {
    if (selectedEffect.type === 'color') {
      return (
        <>
          <div className="inspector-section">
            <label>タイプ</label>
            <select
              value={selectedEffect.type}
              onChange={(e) => handleChange('type', e.target.value)}
            >
              <option value="color">カラー</option>
              <option value="image">画像</option>
            </select>
          </div>

          <div className="inspector-section">
            <label>色</label>
            <input
              type="color"
              value={selectedEffect.color}
              onChange={(e) => handleChange('color', e.target.value)}
            />
          </div>
        </>
      );
    } else if (selectedEffect.type === 'image') {
      return (
        <>
          <div className="inspector-section">
            <label>タイプ</label>
            <select
              value={selectedEffect.type}
              onChange={(e) => handleChange('type', e.target.value)}
            >
              <option value="color">カラー</option>
              <option value="image">画像</option>
            </select>
          </div>

          <div className="inspector-section">
            <label>画像</label>
            {selectedEffect.image ? (
              <img 
                src={selectedEffect.image.src}
                alt="背景画像"
                className="preview-image"
              />
            ) : (
              <div className="drop-placeholder">
                画像をドロップしてください
              </div>
            )}
          </div>
        </>
      );
    }
    return null;
  };

  const renderWaveformProperties = () => {
    if (selectedEffect.type === 'waveform') {
      return (
        <>
          <div className="inspector-section">
            <label>色</label>
            <input
              type="color"
              value={selectedEffect.color}
              onChange={(e) => handleChange('color', e.target.value)}
            />
          </div>

          <div className="inspector-section">
            <label>線の太さ</label>
            <input
              type="number"
              value={selectedEffect.lineWidth}
              onChange={(e) => handleChange('lineWidth', Number(e.target.value))}
              min={1}
              max={10}
            />
          </div>

          <div className="inspector-section">
            <label>高さ</label>
            <input
              type="number"
              value={selectedEffect.height}
              onChange={(e) => handleChange('height', Number(e.target.value))}
              min={10}
              max={300}
            />
          </div>

          <div className="inspector-section">
            <label>垂直位置</label>
            <input
              type="number"
              value={selectedEffect.verticalPosition}
              onChange={(e) => handleChange('verticalPosition', Number(e.target.value))}
              min={0}
              max={100}
            />
          </div>
        </>
      );
    }
    return null;
  };

  const renderCommonProperties = () => (
    <>
      <div className="inspector-section">
        <label>不透明度</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={selectedEffect.opacity}
          onChange={(e) => handleChange('opacity', Number(e.target.value))}
        />
        <span>{Math.round(selectedEffect.opacity * 100)}%</span>
      </div>

      <div className="inspector-section">
        <label>ブレンドモード</label>
        <select
          value={selectedEffect.blendMode}
          onChange={(e) => handleChange('blendMode', e.target.value)}
        >
          <option value="source-over">通常</option>
          <option value="multiply">乗算</option>
          <option value="screen">スクリーン</option>
          <option value="overlay">オーバーレイ</option>
        </select>
      </div>
    </>
  );

  return (
    <div className="inspector">
      {renderBackgroundProperties()}
      {renderWaveformProperties()}
      {renderCommonProperties()}
    </div>
  );
}; 