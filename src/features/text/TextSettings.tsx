import { FC } from 'react';
import { TextEffectConfig, EffectConfig } from '../../core/types';

interface TextSettingsProps {
  config: TextEffectConfig;
  onChange: (newConfig: Partial<EffectConfig>) => void;
}

export const TextSettings: FC<TextSettingsProps> = ({ config, onChange }) => {
  return (
    <div className="settings">
      <div className="setting-group">
        <label>テキスト</label>
        <textarea
          value={config.text}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={3}
        />
      </div>

      <div className="setting-group">
        <label>フォント</label>
        <select
          value={config.style.fontFamily}
          onChange={(e) => onChange({ style: { ...config.style, fontFamily: e.target.value } })}
        >
          <option value="Arial">Arial</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Georgia">Georgia</option>
        </select>
      </div>

      <div className="setting-group">
        <label>フォントサイズ</label>
        <input
          type="number"
          value={config.style.fontSize}
          onChange={(e) => onChange({ style: { ...config.style, fontSize: parseInt(e.target.value) } })}
          min={1}
        />
      </div>

      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={config.style.fontWeight === 'bold'}
            onChange={(e) => onChange({ style: { ...config.style, fontWeight: e.target.checked ? 'bold' : 'normal' } })}
          />
          太字
        </label>
      </div>

      <div className="setting-group">
        <label>文字色</label>
        <input
          type="color"
          value={config.style.color}
          onChange={(e) => onChange({ style: { ...config.style, color: e.target.value } })}
        />
      </div>

      <div className="setting-group">
        <label>縁取り色</label>
        <input
          type="color"
          value={config.style.strokeColor}
          onChange={(e) => onChange({ style: { ...config.style, strokeColor: e.target.value } })}
        />
      </div>

      <div className="setting-group">
        <label>縁取り幅</label>
        <input
          type="number"
          value={config.style.strokeWidth}
          onChange={(e) => onChange({ style: { ...config.style, strokeWidth: parseInt(e.target.value) } })}
          min={0}
        />
      </div>

      <div className="setting-group">
        <label>水平位置</label>
        <select
          value={config.style.align}
          onChange={(e) => onChange({ style: { ...config.style, align: e.target.value as CanvasTextAlign } })}
        >
          <option value="left">左</option>
          <option value="center">中央</option>
          <option value="right">右</option>
        </select>
      </div>

      <div className="setting-group">
        <label>垂直位置</label>
        <select
          value={config.style.baseline}
          onChange={(e) => onChange({ style: { ...config.style, baseline: e.target.value as CanvasTextBaseline } })}
        >
          <option value="top">上</option>
          <option value="middle">中央</option>
          <option value="bottom">下</option>
        </select>
      </div>

      <div className="setting-group">
        <label>X座標</label>
        <input
          type="number"
          value={config.position.x}
          onChange={(e) => onChange({ position: { ...config.position, x: parseInt(e.target.value) } })}
        />
      </div>

      <div className="setting-group">
        <label>Y座標</label>
        <input
          type="number"
          value={config.position.y}
          onChange={(e) => onChange({ position: { ...config.position, y: parseInt(e.target.value) } })}
        />
      </div>
    </div>
  );
}; 