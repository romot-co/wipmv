import React from 'react';
import { BackgroundEffectConfig } from '../../../core/types';
import '../../EffectSettings.css';

interface BackgroundSettingsProps {
  config: BackgroundEffectConfig;
  onChange: (newConfig: Partial<BackgroundEffectConfig>) => void;
}

export const BackgroundSettings: React.FC<BackgroundSettingsProps> = ({
  config,
  onChange
}) => {
  return (
    <div className="effect-settings">
      <div className="setting-group">
        <label>背景種類</label>
        <select
          value={config.backgroundType}
          onChange={(e) => onChange({ backgroundType: e.target.value as BackgroundEffectConfig['backgroundType'] })}
        >
          <option value="solid">単色</option>
          <option value="gradient">グラデーション</option>
          <option value="image">画像</option>
        </select>
      </div>

      {config.backgroundType === 'solid' && (
        <div className="setting-group">
          <label>背景色</label>
          <div className="color-picker">
            <input
              type="color"
              value={config.color}
              onChange={(e) => onChange({ color: e.target.value })}
            />
            <input
              type="text"
              value={config.color}
              onChange={(e) => onChange({ color: e.target.value })}
              pattern="^#[0-9A-Fa-f]{6}$"
            />
          </div>
        </div>
      )}

      {config.backgroundType === 'gradient' && (
        <>
          <div className="setting-group">
            <label>グラデーション開始色</label>
            <div className="color-picker">
              <input
                type="color"
                value={config.gradientColors?.[0]}
                onChange={(e) => {
                  const colors = [...(config.gradientColors || ['#000000', '#ffffff'])];
                  colors[0] = e.target.value;
                  onChange({ gradientColors: colors as [string, string] });
                }}
              />
              <input
                type="text"
                value={config.gradientColors?.[0]}
                onChange={(e) => {
                  const colors = [...(config.gradientColors || ['#000000', '#ffffff'])];
                  colors[0] = e.target.value;
                  onChange({ gradientColors: colors as [string, string] });
                }}
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>

          <div className="setting-group">
            <label>グラデーション終了色</label>
            <div className="color-picker">
              <input
                type="color"
                value={config.gradientColors?.[1]}
                onChange={(e) => {
                  const colors = [...(config.gradientColors || ['#000000', '#ffffff'])];
                  colors[1] = e.target.value;
                  onChange({ gradientColors: colors as [string, string] });
                }}
              />
              <input
                type="text"
                value={config.gradientColors?.[1]}
                onChange={(e) => {
                  const colors = [...(config.gradientColors || ['#000000', '#ffffff'])];
                  colors[1] = e.target.value;
                  onChange({ gradientColors: colors as [string, string] });
                }}
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>

          <div className="setting-group">
            <label>グラデーション方向</label>
            <select
              value={config.gradientDirection}
              onChange={(e) => onChange({ gradientDirection: e.target.value as 'horizontal' | 'vertical' | 'radial' })}
            >
              <option value="horizontal">水平</option>
              <option value="vertical">垂直</option>
              <option value="radial">放射状</option>
            </select>
          </div>
        </>
      )}

      {config.backgroundType === 'image' && (
        <>
          <div className="setting-group">
            <label>画像URL</label>
            <input
              type="text"
              value={config.imageUrl}
              onChange={(e) => onChange({ imageUrl: e.target.value })}
            />
          </div>

          <div className="setting-group">
            <label>画像サイズ</label>
            <select
              value={config.imageSize}
              onChange={(e) => onChange({ imageSize: e.target.value as 'cover' | 'contain' | 'stretch' })}
            >
              <option value="cover">カバー</option>
              <option value="contain">コンテイン</option>
              <option value="stretch">ストレッチ</option>
            </select>
          </div>

          <div className="setting-group">
            <label>画像位置</label>
            <div className="position-inputs">
              <div>
                <label>X座標</label>
                <input
                  type="number"
                  value={config.imagePosition?.x ?? 0}
                  onChange={(e) => onChange({
                    imagePosition: {
                      x: Number(e.target.value),
                      y: config.imagePosition?.y ?? 0
                    }
                  })}
                />
              </div>
              <div>
                <label>Y座標</label>
                <input
                  type="number"
                  value={config.imagePosition?.y ?? 0}
                  onChange={(e) => onChange({
                    imagePosition: {
                      x: config.imagePosition?.x ?? 0,
                      y: Number(e.target.value)
                    }
                  })}
                />
              </div>
            </div>
          </div>
        </>
      )}

      <div className="setting-group">
        <label>不透明度</label>
        <div className="range-input">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={config.opacity ?? 1}
            onChange={(e) => onChange({ opacity: Number(e.target.value) })}
          />
          <span>{config.opacity ?? 1}</span>
        </div>
      </div>

      <div className="setting-group">
        <label>ブレンドモード</label>
        <select
          value={config.blendMode ?? 'source-over'}
          onChange={(e) => onChange({ blendMode: e.target.value as GlobalCompositeOperation })}
        >
          <option value="source-over">通常</option>
          <option value="multiply">乗算</option>
          <option value="screen">スクリーン</option>
          <option value="overlay">オーバーレイ</option>
          <option value="darken">暗く</option>
          <option value="lighten">明るく</option>
        </select>
      </div>
    </div>
  );
}; 