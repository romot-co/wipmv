import React from 'react';
import {
  EffectType,
  BaseEffectConfig,
  BackgroundEffectConfig,
  TextEffectConfig,
  WaveformEffectConfig,
  WatermarkEffectConfig,
} from '../core/types';
import { BackgroundSettings } from '../features/background';
import { TextSettings } from '../features/text';
import { WaveformSettings } from '../features/waveform';
import { WatermarkSettings } from '../features/watermark';

type EffectConfig = BackgroundEffectConfig | TextEffectConfig | WaveformEffectConfig | WatermarkEffectConfig;

interface InspectorProps {
  selectedEffect?: EffectConfig;
  onEffectChange: (newConfig: Partial<EffectConfig>) => void;
}

/**
 * インスペクターコンポーネント
 * 選択中のエフェクトの設定UIを表示する
 */
export const Inspector: React.FC<InspectorProps> = ({
  selectedEffect,
  onEffectChange,
}) => {
  if (!selectedEffect) {
    return (
      <div className="p-4 text-center text-gray-500">
        エフェクトを選択してください
      </div>
    );
  }

  // 共通設定
  const handleCommonChange = (values: Partial<BaseEffectConfig>) => {
    onEffectChange(values);
  };

  const renderCommonSettings = () => (
    <div className="mb-4 p-4 border-b">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">表示/非表示</label>
        <input
          type="checkbox"
          checked={selectedEffect.visible}
          onChange={(e) => handleCommonChange({ visible: e.target.checked })}
          className="mr-2"
        />
        <span className="text-sm">表示する</span>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">重なり順 (Z-Index)</label>
        <input
          type="number"
          value={selectedEffect.zIndex}
          onChange={(e) => handleCommonChange({ zIndex: parseInt(e.target.value) })}
          min={0}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium mb-2">開始時間 (秒)</label>
          <input
            type="number"
            value={selectedEffect.startTime ?? 0}
            onChange={(e) => handleCommonChange({ startTime: parseFloat(e.target.value) })}
            min={0}
            step={0.1}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">終了時間 (秒)</label>
          <input
            type="number"
            value={selectedEffect.endTime ?? 0}
            onChange={(e) => handleCommonChange({ endTime: parseFloat(e.target.value) })}
            min={0}
            step={0.1}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>
    </div>
  );

  // エフェクト固有の設定
  const renderEffectSettings = () => {
    switch (selectedEffect.type) {
      case EffectType.Background:
        return (
          <BackgroundSettings
            config={selectedEffect as BackgroundEffectConfig}
            onChange={onEffectChange}
          />
        );
      case EffectType.Text:
        return (
          <TextSettings
            config={selectedEffect as TextEffectConfig}
            onChange={onEffectChange}
          />
        );
      case EffectType.Waveform:
        return (
          <WaveformSettings
            config={selectedEffect as WaveformEffectConfig}
            onChange={onEffectChange}
          />
        );
      case EffectType.Watermark:
        return (
          <WatermarkSettings
            config={selectedEffect as WatermarkEffectConfig}
            onChange={onEffectChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      {renderCommonSettings()}
      {renderEffectSettings()}
    </div>
  );
}; 