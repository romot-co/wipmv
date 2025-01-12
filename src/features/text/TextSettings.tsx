import React from 'react';
import { TextEffectConfig, TextStyle, TextAnimation } from '../../core/types';

interface TextSettingsProps {
  config: TextEffectConfig;
  onChange: (newConfig: Partial<TextEffectConfig>) => void;
}

/**
 * テキストエフェクトの設定UI
 */
export const TextSettings: React.FC<TextSettingsProps> = ({
  config,
  onChange,
}) => {
  const handleTextChange = (text: string) => {
    onChange({ text });
  };

  const handleStyleChange = (style: Partial<TextStyle>) => {
    onChange({
      style: {
        ...config.style,
        ...style,
      },
    });
  };

  const handlePositionChange = (key: 'x' | 'y', value: number) => {
    onChange({
      position: {
        ...config.position,
        [key]: value,
      },
    });
  };

  const handleAnimationChange = (animation: Partial<TextAnimation>) => {
    onChange({
      animation: config.animation
        ? { ...config.animation, ...animation }
        : { type: 'fade', duration: 1000, ...animation },
    });
  };

  return (
    <div className="p-4">
      {/* テキスト入力 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">テキスト</label>
        <textarea
          value={config.text}
          onChange={(e) => handleTextChange(e.target.value)}
          className="w-full p-2 border rounded"
          rows={3}
        />
      </div>

      {/* フォントスタイル */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">フォント</label>
        <select
          value={config.style.fontFamily}
          onChange={(e) => handleStyleChange({ fontFamily: e.target.value })}
          className="w-full p-2 border rounded mb-2"
        >
          <option value="Arial">Arial</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="sans-serif">sans-serif</option>
        </select>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs mb-1">サイズ</label>
            <input
              type="number"
              value={config.style.fontSize}
              onChange={(e) => handleStyleChange({ fontSize: parseInt(e.target.value) })}
              min={1}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">ウェイト</label>
            <select
              value={config.style.fontWeight}
              onChange={(e) => handleStyleChange({ fontWeight: e.target.value })}
              className="w-full p-2 border rounded"
            >
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="300">300</option>
              <option value="400">400</option>
              <option value="500">500</option>
              <option value="600">600</option>
              <option value="700">700</option>
              <option value="800">800</option>
              <option value="900">900</option>
            </select>
          </div>
        </div>
      </div>

      {/* カラー設定 */}
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium mb-2">テキスト色</label>
            <input
              type="color"
              value={config.style.color}
              onChange={(e) => handleStyleChange({ color: e.target.value })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">ストローク色</label>
            <input
              type="color"
              value={config.style.strokeColor || '#000000'}
              onChange={(e) => handleStyleChange({ strokeColor: e.target.value })}
              className="w-full"
            />
          </div>
        </div>
        <div className="mt-2">
          <label className="block text-xs mb-1">ストローク幅</label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={config.style.strokeWidth || 0}
            onChange={(e) => handleStyleChange({ strokeWidth: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>

      {/* 位置設定 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">位置</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs mb-1">X</label>
            <input
              type="number"
              value={config.position.x}
              onChange={(e) => handlePositionChange('x', parseInt(e.target.value))}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Y</label>
            <input
              type="number"
              value={config.position.y}
              onChange={(e) => handlePositionChange('y', parseInt(e.target.value))}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>

      {/* アニメーション設定 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">アニメーション</label>
        <select
          value={config.animation?.type || 'fade'}
          onChange={(e) => handleAnimationChange({ type: e.target.value as TextAnimation['type'] })}
          className="w-full p-2 border rounded mb-2"
        >
          <option value="fade">フェード</option>
          <option value="scale">スケール</option>
          <option value="slide">スライド</option>
        </select>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs mb-1">デュレーション (ms)</label>
            <input
              type="number"
              value={config.animation?.duration || 1000}
              onChange={(e) => handleAnimationChange({ duration: parseInt(e.target.value) })}
              min={0}
              step={100}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">ディレイ (ms)</label>
            <input
              type="number"
              value={config.animation?.delay || 0}
              onChange={(e) => handleAnimationChange({ delay: parseInt(e.target.value) })}
              min={0}
              step={100}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 