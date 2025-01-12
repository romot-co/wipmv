import React from 'react';
import { WatermarkEffectConfig, WatermarkPosition, WatermarkStyle, Position2D } from '../../core/types';

interface WatermarkSettingsProps {
  config: WatermarkEffectConfig;
  onChange: (newConfig: Partial<WatermarkEffectConfig>) => void;
}

/**
 * ウォーターマークエフェクトの設定UI
 */
export const WatermarkSettings: React.FC<WatermarkSettingsProps> = ({
  config,
  onChange,
}) => {
  const handleImageUrlChange = (imageUrl: string) => {
    onChange({ imageUrl });
  };

  const handlePositionChange = (position: Partial<WatermarkPosition>) => {
    onChange({
      position: {
        ...config.position,
        ...position,
      },
    });
  };

  const handleStyleChange = (style: Partial<WatermarkStyle>) => {
    onChange({
      style: {
        ...config.style,
        ...style,
      },
    });
  };

  const handleRepeatChange = (repeat: boolean) => {
    onChange({ repeat });
  };

  const handleMarginChange = (key: keyof Position2D, value: number) => {
    const margin: Position2D = {
      x: config.margin?.x ?? 0,
      y: config.margin?.y ?? 0,
      [key]: value,
    };
    onChange({ margin });
  };

  return (
    <div className="p-4">
      {/* 画像URL */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">画像URL</label>
        <input
          type="text"
          value={config.imageUrl}
          onChange={(e) => handleImageUrlChange(e.target.value)}
          placeholder="https://example.com/watermark.png"
          className="w-full p-2 border rounded"
        />
      </div>

      {/* 位置とサイズ */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">位置とサイズ</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs mb-1">X</label>
            <input
              type="number"
              value={config.position.x}
              onChange={(e) => handlePositionChange({ x: parseInt(e.target.value) })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Y</label>
            <input
              type="number"
              value={config.position.y}
              onChange={(e) => handlePositionChange({ y: parseInt(e.target.value) })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">幅</label>
            <input
              type="number"
              value={config.position.width}
              onChange={(e) => handlePositionChange({ width: parseInt(e.target.value) })}
              min={1}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">高さ</label>
            <input
              type="number"
              value={config.position.height}
              onChange={(e) => handlePositionChange({ height: parseInt(e.target.value) })}
              min={1}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <label className="block text-xs mb-1">スケール</label>
            <input
              type="range"
              min={0.1}
              max={2}
              step={0.1}
              value={config.position.scale || 1}
              onChange={(e) => handlePositionChange({ scale: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">回転 ({config.position.rotation || 0}°)</label>
            <input
              type="range"
              min={0}
              max={360}
              value={config.position.rotation || 0}
              onChange={(e) => handlePositionChange({ rotation: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* スタイル設定 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">スタイル</label>
        <div className="space-y-2">
          <div>
            <label className="block text-xs mb-1">不透明度</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={config.style.opacity}
              onChange={(e) => handleStyleChange({ opacity: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">ブレンドモード</label>
            <select
              value={config.style.blendMode || 'source-over'}
              onChange={(e) => handleStyleChange({ blendMode: e.target.value as GlobalCompositeOperation })}
              className="w-full p-2 border rounded"
            >
              <option value="source-over">通常</option>
              <option value="multiply">乗算</option>
              <option value="screen">スクリーン</option>
              <option value="overlay">オーバーレイ</option>
              <option value="darken">暗く</option>
              <option value="lighten">明るく</option>
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1">色調</label>
            <input
              type="color"
              value={config.style.tint || '#ffffff'}
              onChange={(e) => handleStyleChange({ tint: e.target.value })}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* リピートと余白 */}
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            checked={config.repeat || false}
            onChange={(e) => handleRepeatChange(e.target.checked)}
            className="mr-2"
          />
          <label className="text-sm">リピート表示</label>
        </div>

        {config.repeat && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs mb-1">横余白</label>
              <input
                type="number"
                value={config.margin?.x || 0}
                onChange={(e) => handleMarginChange('x', parseInt(e.target.value))}
                min={0}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-xs mb-1">縦余白</label>
              <input
                type="number"
                value={config.margin?.y || 0}
                onChange={(e) => handleMarginChange('y', parseInt(e.target.value))}
                min={0}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 