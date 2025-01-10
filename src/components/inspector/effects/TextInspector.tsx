import React from 'react';
import { TextEffectConfig, VisualEffectConfig } from '../../../types/effects';

interface TextInspectorProps {
  config: VisualEffectConfig;
  onUpdate: (config: Partial<VisualEffectConfig>) => void;
}

export const TextInspector: React.FC<TextInspectorProps> = ({
  config,
  onUpdate
}) => {
  const textConfig = config as TextEffectConfig;

  return (
    <div className="text-inspector">
      <div className="setting-group">
        <label>テキスト</label>
        <input
          type="text"
          value={textConfig.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
        />
      </div>

      <div className="setting-group">
        <label>フォント</label>
        <select
          value={textConfig.font}
          onChange={(e) => onUpdate({ font: e.target.value })}
        >
          <option value="Noto Sans JP">Noto Sans JP</option>
          <option value="Noto Serif JP">Noto Serif JP</option>
          <option value="M PLUS 1p">M PLUS 1p</option>
          <option value="Kosugi Maru">Kosugi Maru</option>
          <option value="Sawarabi Gothic">Sawarabi Gothic</option>
        </select>
      </div>

      <div className="setting-group">
        <label>フォントサイズ</label>
        <input
          type="range"
          min="8"
          max="72"
          value={textConfig.fontSize}
          onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
        />
      </div>

      <div className="setting-group">
        <label>色</label>
        <input
          type="color"
          value={textConfig.color}
          onChange={(e) => onUpdate({ color: e.target.value })}
        />
      </div>

      <div className="setting-group">
        <label>位置 X (%)</label>
        <input
          type="range"
          min="0"
          max="100"
          value={textConfig.position.x * 100}
          onChange={(e) => onUpdate({
            position: {
              ...textConfig.position,
              x: parseInt(e.target.value) / 100
            }
          })}
        />
      </div>

      <div className="setting-group">
        <label>位置 Y (%)</label>
        <input
          type="range"
          min="0"
          max="100"
          value={textConfig.position.y * 100}
          onChange={(e) => onUpdate({
            position: {
              ...textConfig.position,
              y: parseInt(e.target.value) / 100
            }
          })}
        />
      </div>

      <div className="setting-group">
        <label>アニメーション</label>
        <select
          value={textConfig.animation}
          onChange={(e) => onUpdate({ animation: e.target.value as TextEffectConfig['animation'] })}
        >
          <option value="none">なし</option>
          <option value="fadeIn">フェードイン</option>
          <option value="fadeOut">フェードアウト</option>
          <option value="slideIn">スライドイン</option>
          <option value="slideOut">スライドアウト</option>
        </select>
      </div>

      <div className="setting-group">
        <label>開始時間 (秒)</label>
        <input
          type="number"
          min="0"
          step="0.1"
          value={textConfig.startTime}
          onChange={(e) => onUpdate({ startTime: parseFloat(e.target.value) })}
        />
      </div>

      <div className="setting-group">
        <label>終了時間 (秒)</label>
        <input
          type="number"
          min="0"
          step="0.1"
          value={textConfig.endTime}
          onChange={(e) => onUpdate({ endTime: parseFloat(e.target.value) })}
        />
      </div>
    </div>
  );
}; 