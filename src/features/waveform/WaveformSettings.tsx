import React from 'react';
import { WaveformEffectConfig, WaveformStyle, WaveformColors, Rectangle } from '../../core/types';

interface WaveformSettingsProps {
  config: WaveformEffectConfig;
  onChange: (newConfig: Partial<WaveformEffectConfig>) => void;
}

/**
 * 波形エフェクトの設定UI
 */
export const WaveformSettings: React.FC<WaveformSettingsProps> = ({
  config,
  onChange,
}) => {
  const handleStyleChange = (style: WaveformStyle) => {
    onChange({ style });
  };

  const handleColorsChange = (colors: Partial<WaveformColors>) => {
    onChange({
      colors: {
        ...config.colors,
        ...colors,
      },
    });
  };

  const handlePositionChange = (position: Partial<Rectangle>) => {
    onChange({
      position: {
        ...config.position,
        ...position,
      },
    });
  };

  const handleOptionsChange = (options: Partial<NonNullable<WaveformEffectConfig['options']>>) => {
    onChange({
      options: {
        ...config.options,
        ...options,
      },
    });
  };

  return (
    <div className="p-4">
      {/* スタイル選択 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">波形スタイル</label>
        <select
          value={config.style}
          onChange={(e) => handleStyleChange(e.target.value as WaveformStyle)}
          className="w-full p-2 border rounded"
        >
          <option value="line">ライン</option>
          <option value="bar">バー</option>
          <option value="mirror">ミラー</option>
        </select>
      </div>

      {/* カラー設定 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">カラー</label>
        <div className="space-y-2">
          <div>
            <label className="block text-xs mb-1">プライマリカラー</label>
            <input
              type="color"
              value={config.colors.primary}
              onChange={(e) => handleColorsChange({ primary: e.target.value })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">セカンダリカラー</label>
            <input
              type="color"
              value={config.colors.secondary || '#000000'}
              onChange={(e) => handleColorsChange({ secondary: e.target.value })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">背景色</label>
            <input
              type="color"
              value={config.colors.background || '#ffffff'}
              onChange={(e) => handleColorsChange({ background: e.target.value })}
              className="w-full"
            />
          </div>
        </div>
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
      </div>

      {/* オプション設定 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">オプション</label>
        <div className="space-y-4">
          {config.style === 'bar' && (
            <>
              <div>
                <label className="block text-xs mb-1">バー幅</label>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={config.options?.barWidth || 2}
                  onChange={(e) => handleOptionsChange({ barWidth: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs mb-1">バー間隔</label>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={config.options?.barSpacing || 1}
                  onChange={(e) => handleOptionsChange({ barSpacing: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-xs mb-1">スムージング</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={config.options?.smoothing || 0.5}
              onChange={(e) => handleOptionsChange({ smoothing: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={config.options?.mirror || false}
              onChange={(e) => handleOptionsChange({ mirror: e.target.checked })}
              className="mr-2"
            />
            <label className="text-sm">ミラーモード</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={config.options?.responsive || false}
              onChange={(e) => handleOptionsChange({ responsive: e.target.checked })}
              className="mr-2"
            />
            <label className="text-sm">レスポンシブ</label>
          </div>
        </div>
      </div>
    </div>
  );
}; 