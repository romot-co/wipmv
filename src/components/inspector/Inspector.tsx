import React from 'react';
import { EffectType } from '../../services/effects/core/EffectManager';
import { 
  VisualEffectConfig,
  BackgroundEffectConfig,
  WaveformEffectConfig,
  TextEffectConfig,
  WatermarkConfig
} from '../../types/effects';
import './Inspector.css';

interface InspectorProps {
  selectedEffect: VisualEffectConfig | null;
  effectType: EffectType | null;
  onEffectUpdate: (type: EffectType, config: Partial<VisualEffectConfig>) => void;
}

export const Inspector: React.FC<InspectorProps> = ({
  selectedEffect,
  effectType,
  onEffectUpdate
}) => {
  if (!selectedEffect || !effectType) {
    return (
      <div className="inspector">
        <div className="inspector-header">
          <h2>インスペクター</h2>
        </div>
        <div className="inspector-content empty">
          <p>エフェクトを選択してください</p>
        </div>
      </div>
    );
  }

  const handleCommonUpdate = (
    updates: Partial<{
      opacity: number;
      blendMode: GlobalCompositeOperation;
      startTime: number;
      endTime: number;
      zIndex: number;
    }>
  ) => {
    onEffectUpdate(effectType, updates);
  };

  const renderBackgroundInspector = (config: BackgroundEffectConfig) => (
    <>
      <div className="inspector-section">
        <h3>背景タイプ</h3>
        <select
          value={config.type}
          onChange={(e) => onEffectUpdate(effectType, { type: e.target.value as 'color' | 'image' })}
        >
          <option value="color">単色</option>
          <option value="image">画像</option>
        </select>
      </div>

      {config.type === 'color' && (
        <div className="inspector-section">
          <h3>色</h3>
          <input
            type="color"
            value={config.color || '#000000'}
            onChange={(e) => onEffectUpdate(effectType, { color: e.target.value })}
          />
        </div>
      )}
    </>
  );

  const renderWaveformInspector = (config: WaveformEffectConfig) => (
    <>
      <div className="inspector-section">
        <h3>波形スタイル</h3>
        <select
          value={config.style}
          onChange={(e) => onEffectUpdate(effectType, { style: e.target.value as 'line' | 'mirror' | 'bars' })}
        >
          <option value="line">ライン</option>
          <option value="mirror">ミラー</option>
          <option value="bars">バー</option>
        </select>
      </div>

      <div className="inspector-section">
        <h3>色</h3>
        <input
          type="color"
          value={config.color || '#ffffff'}
          onChange={(e) => onEffectUpdate(effectType, { color: e.target.value })}
        />
      </div>

      <div className="inspector-section">
        <h3>線の太さ</h3>
        <input
          type="range"
          min="1"
          max="10"
          value={config.lineWidth}
          onChange={(e) => onEffectUpdate(effectType, { lineWidth: Number(e.target.value) })}
        />
      </div>

      <div className="inspector-section">
        <h3>高さ</h3>
        <input
          type="range"
          min="50"
          max="400"
          value={config.height}
          onChange={(e) => onEffectUpdate(effectType, { height: Number(e.target.value) })}
        />
      </div>

      <div className="inspector-section">
        <h3>垂直位置</h3>
        <input
          type="range"
          min="0"
          max="100"
          value={config.verticalPosition}
          onChange={(e) => onEffectUpdate(effectType, { verticalPosition: Number(e.target.value) })}
        />
      </div>

      {config.style === 'bars' && (
        <>
          <div className="inspector-section">
            <h3>バーの幅</h3>
            <input
              type="range"
              min="1"
              max="20"
              value={config.barWidth ?? 4}
              onChange={(e) => onEffectUpdate(effectType, { barWidth: Number(e.target.value) })}
            />
          </div>

          <div className="inspector-section">
            <h3>バーの間隔</h3>
            <input
              type="range"
              min="0"
              max="10"
              value={config.barSpacing ?? 2}
              onChange={(e) => onEffectUpdate(effectType, { barSpacing: Number(e.target.value) })}
            />
          </div>
        </>
      )}

      {config.style === 'mirror' && (
        <div className="inspector-section">
          <h3>ミラー間隔</h3>
          <input
            type="range"
            min="0"
            max="50"
            value={config.mirrorGap ?? 10}
            onChange={(e) => onEffectUpdate(effectType, { mirrorGap: Number(e.target.value) })}
          />
        </div>
      )}

      <div className="inspector-section">
        <h3>波形の滑らかさ</h3>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={config.smoothing ?? 0.5}
          onChange={(e) => onEffectUpdate(effectType, { smoothing: Number(e.target.value) })}
        />
      </div>

      <div className="inspector-section">
        <h3>増幅率</h3>
        <input
          type="range"
          min="0.1"
          max="5"
          step="0.1"
          value={config.amplification ?? 1}
          onChange={(e) => onEffectUpdate(effectType, { amplification: Number(e.target.value) })}
        />
      </div>
    </>
  );

  const renderTextInspector = (config: TextEffectConfig) => (
    <>
      <div className="inspector-section">
        <h3>テキスト</h3>
        <input
          type="text"
          value={config.text}
          onChange={(e) => onEffectUpdate(effectType, { text: e.target.value })}
        />
      </div>

      <div className="inspector-section">
        <h3>フォント</h3>
        <select
          value={config.font}
          onChange={(e) => onEffectUpdate(effectType, { font: e.target.value })}
        >
          <option value="Noto Sans JP">Noto Sans JP</option>
          <option value="Noto Serif JP">Noto Serif JP</option>
          <option value="M PLUS 1p">M PLUS 1p</option>
          <option value="Kosugi Maru">Kosugi Maru</option>
          <option value="Sawarabi Gothic">Sawarabi Gothic</option>
          <option value="Sawarabi Mincho">Sawarabi Mincho</option>
          <option value="Arial">Arial</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
        </select>
      </div>

      <div className="inspector-section">
        <h3>フォントサイズ</h3>
        <input
          type="range"
          min="12"
          max="72"
          value={config.fontSize}
          onChange={(e) => onEffectUpdate(effectType, { fontSize: Number(e.target.value) })}
        />
        <span className="range-value">{config.fontSize}px</span>
      </div>

      <div className="inspector-section">
        <h3>色</h3>
        <input
          type="color"
          value={config.color}
          onChange={(e) => onEffectUpdate(effectType, { color: e.target.value })}
        />
      </div>

      <div className="inspector-section">
        <h3>位置</h3>
        <div className="position-inputs">
          <div className="position-input">
            <label>X</label>
            <input
              type="range"
              min="0"
              max="100"
              value={config.position.x * 100}
              onChange={(e) => onEffectUpdate(effectType, { 
                position: { ...config.position, x: Number(e.target.value) / 100 }
              })}
            />
            <span className="range-value">{Math.round(config.position.x * 100)}%</span>
          </div>
          <div className="position-input">
            <label>Y</label>
            <input
              type="range"
              min="0"
              max="100"
              value={config.position.y * 100}
              onChange={(e) => onEffectUpdate(effectType, { 
                position: { ...config.position, y: Number(e.target.value) / 100 }
              })}
            />
            <span className="range-value">{Math.round(config.position.y * 100)}%</span>
          </div>
        </div>
      </div>

      <div className="inspector-section">
        <h3>アニメーション</h3>
        <select
          value={config.animation}
          onChange={(e) => onEffectUpdate(effectType, { 
            animation: e.target.value as 'none' | 'fadeIn' | 'fadeOut' | 'slideIn' | 'slideOut'
          })}
        >
          <option value="none">なし</option>
          <option value="fadeIn">フェードイン</option>
          <option value="fadeOut">フェードアウト</option>
          <option value="slideIn">スライドイン</option>
          <option value="slideOut">スライドアウト</option>
        </select>
      </div>

      {config.animation !== 'none' && (
        <div className="inspector-section">
          <h3>アニメーション時間</h3>
          <div className="animation-timing">
            <div className="timing-input">
              <label>開始</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={config.startTime}
                onChange={(e) => onEffectUpdate(effectType, { startTime: Number(e.target.value) })}
              />
            </div>
            <div className="timing-input">
              <label>終了</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={config.endTime}
                onChange={(e) => onEffectUpdate(effectType, { endTime: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderWatermarkInspector = (config: WatermarkConfig) => (
    <>
      <div className="inspector-section">
        <h3>画像</h3>
        <div className="image-upload">
          {config.image ? (
            <div className="image-preview">
              <img src={config.image.src} alt="ウォーターマーク" />
              <button onClick={() => onEffectUpdate(effectType, { image: undefined })}>
                削除
              </button>
            </div>
          ) : (
            <div className="image-drop-zone">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const img = new Image();
                      img.onload = () => {
                        onEffectUpdate(effectType, { image: img });
                      };
                      img.src = event.target?.result as string;
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <p>画像をドロップまたはクリックして選択</p>
            </div>
          )}
        </div>
      </div>

      <div className="inspector-section">
        <h3>配置</h3>
        <select
          value={config.alignment ?? 'custom'}
          onChange={(e) => {
            const alignment = e.target.value as WatermarkConfig['alignment'];
            let position = { ...config.position };
            
            switch (alignment) {
              case 'left':
                position = { x: 0, y: 0.5 };
                break;
              case 'center':
                position = { x: 0.5, y: 0.5 };
                break;
              case 'right':
                position = { x: 1, y: 0.5 };
                break;
            }
            
            onEffectUpdate(effectType, { alignment, position });
          }}
        >
          <option value="custom">カスタム</option>
          <option value="left">左</option>
          <option value="center">中央</option>
          <option value="right">右</option>
        </select>
      </div>

      {config.alignment === 'custom' && (
        <div className="inspector-section">
          <h3>位置</h3>
          <div className="position-inputs">
            <div className="position-input">
              <label>X</label>
              <input
                type="range"
                min="0"
                max="100"
                value={config.position.x * 100}
                onChange={(e) => onEffectUpdate(effectType, { 
                  position: { ...config.position, x: Number(e.target.value) / 100 }
                })}
              />
              <span className="range-value">{Math.round(config.position.x * 100)}%</span>
            </div>
            <div className="position-input">
              <label>Y</label>
              <input
                type="range"
                min="0"
                max="100"
                value={config.position.y * 100}
                onChange={(e) => onEffectUpdate(effectType, { 
                  position: { ...config.position, y: Number(e.target.value) / 100 }
                })}
              />
              <span className="range-value">{Math.round(config.position.y * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      <div className="inspector-section">
        <h3>サイズ</h3>
        <div className="size-inputs">
          <input
            type="number"
            value={config.size?.width ?? 0}
            onChange={(e) => {
              const width = Number(e.target.value);
              const height = config.size?.height ?? 0;
              onEffectUpdate(effectType, { 
                size: { width, height }
              });
            }}
          />
          <span>×</span>
          <input
            type="number"
            value={config.size?.height ?? 0}
            onChange={(e) => {
              const height = Number(e.target.value);
              const width = config.size?.width ?? 0;
              onEffectUpdate(effectType, { 
                size: { width, height }
              });
            }}
          />
        </div>
      </div>

      <div className="inspector-section">
        <h3>アスペクト比を維持</h3>
        <input
          type="checkbox"
          checked={config.maintainAspectRatio}
          onChange={(e) => onEffectUpdate(effectType, { maintainAspectRatio: e.target.checked })}
        />
      </div>

      <div className="inspector-section">
        <h3>回転</h3>
        <input
          type="range"
          min="0"
          max="360"
          value={config.rotation ?? 0}
          onChange={(e) => onEffectUpdate(effectType, { rotation: Number(e.target.value) })}
        />
        <span className="range-value">{config.rotation ?? 0}°</span>
      </div>

      <div className="inspector-section">
        <h3>反転</h3>
        <div className="flip-controls">
          <label>
            <input
              type="checkbox"
              checked={config.flip?.horizontal ?? false}
              onChange={(e) => onEffectUpdate(effectType, { 
                flip: { 
                  horizontal: e.target.checked,
                  vertical: config.flip?.vertical ?? false
                }
              })}
            />
            水平
          </label>
          <label>
            <input
              type="checkbox"
              checked={config.flip?.vertical ?? false}
              onChange={(e) => onEffectUpdate(effectType, { 
                flip: { 
                  horizontal: config.flip?.horizontal ?? false,
                  vertical: e.target.checked
                }
              })}
            />
            垂直
          </label>
        </div>
      </div>
    </>
  );

  return (
    <div className="inspector">
      <div className="inspector-header">
        <h2>
          {effectType === 'background' && '背景'}
          {effectType === 'waveform' && '波形'}
          {effectType === 'text' && 'テキスト'}
          {effectType === 'watermark' && 'ウォーターマーク'}
        </h2>
      </div>

      <div className="inspector-content">
        {/* 共通設定 */}
        <div className="inspector-section">
          <h3>表示時間</h3>
          <div className="time-inputs">
            <div className="time-input">
              <label>開始</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={selectedEffect.startTime ?? 0}
                onChange={(e) => handleCommonUpdate({ startTime: Number(e.target.value) })}
              />
            </div>
            <div className="time-input">
              <label>終了</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={selectedEffect.endTime ?? 0}
                onChange={(e) => handleCommonUpdate({ endTime: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>

        <div className="inspector-section">
          <h3>重ね順</h3>
          <input
            type="number"
            min="0"
            value={selectedEffect.zIndex ?? 0}
            onChange={(e) => handleCommonUpdate({ zIndex: Number(e.target.value) })}
          />
        </div>

        <div className="inspector-section">
          <h3>不透明度</h3>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={selectedEffect.opacity}
            onChange={(e) => handleCommonUpdate({ opacity: Number(e.target.value) })}
          />
        </div>

        <div className="inspector-section">
          <h3>ブレンドモード</h3>
          <select
            value={selectedEffect.blendMode}
            onChange={(e) => handleCommonUpdate({ blendMode: e.target.value as GlobalCompositeOperation })}
          >
            <option value="source-over">通常</option>
            <option value="multiply">乗算</option>
            <option value="screen">スクリーン</option>
            <option value="overlay">オーバーレイ</option>
          </select>
        </div>

        {/* エフェクト固有の設定 */}
        {effectType === 'background' && renderBackgroundInspector(selectedEffect as BackgroundEffectConfig)}
        {effectType === 'waveform' && renderWaveformInspector(selectedEffect as WaveformEffectConfig)}
        {effectType === 'text' && renderTextInspector(selectedEffect as TextEffectConfig)}
        {effectType === 'watermark' && renderWatermarkInspector(selectedEffect as WatermarkConfig)}
      </div>
    </div>
  );
}; 