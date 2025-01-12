import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Inspector } from './ui/Inspector';
import { EffectType, BackgroundEffectConfig, TextEffectConfig, WaveformEffectConfig, WatermarkEffectConfig, ErrorType, AppError, ErrorMessages } from './core/types';
import { useEffectManager } from './hooks/useEffectManager';
import { useAudioData } from './hooks/useAudioData';
import { useVideoEncoder } from './hooks/useVideoEncoder';
import { decodeAudioFile } from './utils/audioUtils';
import { BackgroundEffect } from './features/background';
import { TextEffect } from './features/text';
import { WaveformEffect } from './features/waveform';
import { WatermarkEffect } from './features/watermark';
import { EffectManager } from './core/EffectManager';

type EffectConfig = BackgroundEffectConfig | TextEffectConfig | WaveformEffectConfig | WatermarkEffectConfig;

/**
 * メインアプリケーションコンポーネント
 */
function App() {
  // オーディオ関連の状態
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // エフェクト関連の状態
  const [selectedEffectId, setSelectedEffectId] = useState<string>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { manager, setManager, updateTrigger } = useEffectManager();
  const { waveformData, frequencyData, updateAudioData } = useAudioData();
  const { isEncoding, progress, error: encoderError, startEncoding, stopEncoding } = useVideoEncoder();

  // エラー表示用のstate
  const [appError, setAppError] = useState<{ type: ErrorType; message: string } | null>(null);

  // エクスポート関連の状態
  const [exportStartTime, setExportStartTime] = useState<number>(0);

  // プレビューキャンバスの初期化
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const newManager = new EffectManager(canvas);
      newManager.start();
      setManager(newManager);

      // 初期エフェクトの追加（背景）
      const effectId = `effect-${Date.now()}`;
      const backgroundEffect = new BackgroundEffect({
        type: EffectType.Background,
        visible: true,
        zIndex: 0,
        backgroundType: 'color',
        color: '#000000',
      });
      newManager.addEffect(backgroundEffect, effectId);

      return () => {
        newManager.dispose();
      };
    } catch (error) {
      handleError(error);
    }
  }, []); // マウント時に一度だけ実行

  // オーディオデータの更新
  useEffect(() => {
    if (!manager || !waveformData || !frequencyData) return;
    manager.updateAudioData(waveformData, frequencyData);
  }, [manager, waveformData, frequencyData]);

  // エラーハンドリング用のユーティリティ関数
  const handleError = useCallback((err: unknown) => {
    if (err instanceof AppError) {
      setAppError({
        type: err.type,
        message: `${ErrorMessages[err.type]}: ${err.message}`,
      });
    } else if (err instanceof Error) {
      setAppError({
        type: ErrorType.ExportEncodeFailed,
        message: `予期せぬエラーが発生しました: ${err.message}`,
      });
    } else {
      setAppError({
        type: ErrorType.ExportEncodeFailed,
        message: '予期せぬエラーが発生しました',
      });
    }
  }, []);

  // エラーメッセージを閉じる
  const handleCloseError = useCallback(() => {
    setAppError(null);
  }, []);

  // オーディオファイルのアップロード処理
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setAudioFile(file);
      const audioBuffer = await decodeAudioFile(file);
      await updateAudioData(audioBuffer);

      // オーディオプレビュー用のURL生成
      const audioUrl = URL.createObjectURL(file);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.volume = 0; // 音声は出さない（波形表示用のみ）
        setIsPlaying(false); // 自動再生を防ぐ
      }
    } catch (error) {
      handleError(error);
    }
  }, [updateAudioData, handleError]);

  // 再生コントロール
  const handlePlayPause = useCallback(() => {
    if (!audioRef.current || !manager) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        manager.stop();
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              manager.start();
            })
            .catch((error) => {
              manager.stop();
              handleError(error);
            });
        }
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      manager.stop();
      handleError(error);
    }
  }, [isPlaying, manager, handleError]);

  // 時間更新
  const handleTimeUpdate = useCallback((event: React.SyntheticEvent<HTMLAudioElement>) => {
    if (!manager) return;

    const audioElement = event.currentTarget;
    manager.updateTime(audioElement.currentTime);
    manager.updateDuration(audioElement.duration);
  }, [manager]);

  // 再生終了時の処理
  const handleEnded = useCallback(() => {
    if (manager) {
      manager.stop();
    }
    setIsPlaying(false);
  }, [manager]);

  // エフェクト追加
  const handleAddEffect = useCallback((type: EffectType) => {
    if (!manager) return;

    try {
      const effectId = `effect-${Date.now()}`;
      let effect;

      switch (type) {
        case EffectType.Background:
          effect = new BackgroundEffect({
            type: EffectType.Background,
            visible: true,
            zIndex: manager.getEffects().size,
            backgroundType: 'color',
            color: '#000000',
          });
          break;
        case EffectType.Text:
          effect = new TextEffect({
            type: EffectType.Text,
            visible: true,
            zIndex: manager.getEffects().size,
            text: 'テキストを入力',
            style: {
              fontFamily: 'Arial',
              fontSize: 48,
              fontWeight: 'normal',
              color: '#ffffff',
              strokeColor: '#000000',
              strokeWidth: 0,
              textAlign: 'center',
              textBaseline: 'middle',
            },
            position: { x: 640, y: 360 },
          });
          break;
        case EffectType.Waveform:
          effect = new WaveformEffect({
            type: EffectType.Waveform,
            visible: true,
            zIndex: manager.getEffects().size,
            style: 'line',
            colors: {
              primary: '#ffffff',
              secondary: '#888888',
              background: '#000000'
            },
            position: { x: 0, y: 360, width: 1280, height: 200 },
            options: {
              barWidth: 2,
              barSpacing: 1,
              smoothing: 0.5,
              mirror: false
            }
          });
          break;
        case EffectType.Watermark:
          effect = new WatermarkEffect({
            type: EffectType.Watermark,
            visible: true,
            zIndex: manager.getEffects().size,
            imageUrl: '',
            position: { x: 640, y: 360 },
            size: { width: 200, height: 200 },
            scale: 1,
            rotation: 0,
            opacity: 0.5,
            blendMode: 'normal',
          });
          break;
        default:
          return;
      }

      if (effect) {
        manager.addEffect(effect, effectId);
        setSelectedEffectId(effectId);
        // 新しいmanagerインスタンスを作成して状態を更新
        const newManager = new EffectManager(canvasRef.current!);
        newManager.start();
        Array.from(manager.getEffects().entries()).forEach(([id, effect]) => {
          newManager.addEffect(effect, id);
        });
        setManager(newManager);
      }
    } catch (error) {
      handleError(error);
    }
  }, [manager, canvasRef, setManager, handleError]);

  // エフェクト更新
  const handleEffectChange = useCallback((newConfig: Partial<EffectConfig>) => {
    if (!manager || !selectedEffectId) return;

    try {
      const effect = manager.getEffect(selectedEffectId);
      if (!effect) return;

      manager.updateEffect(selectedEffectId, newConfig);
    } catch (error) {
      handleError(error);
    }
  }, [manager, selectedEffectId, handleError]);

  // エクスポート処理
  const handleExport = useCallback(async () => {
    if (!audioRef.current || !manager || !canvasRef.current) return;

    try {
      setExportStartTime(Date.now());
      await startEncoding(canvasRef.current, audioRef.current.duration);
    } catch (error) {
      handleError(error);
    }
  }, [manager, startEncoding, handleError]);

  // エクスポートのキャンセル
  const handleCancelExport = useCallback(() => {
    try {
      stopEncoding();
      setAppError({
        type: ErrorType.ExportCanceled,
        message: ErrorMessages[ErrorType.ExportCanceled],
      });
    } catch (error) {
      handleError(error);
    }
  }, [stopEncoding, handleError]);

  // 残り時間の計算
  const getRemainingTime = useCallback((progress: number) => {
    if (progress === 0) return null;
    
    const elapsed = (Date.now() - exportStartTime) / 1000;
    const total = elapsed / progress;
    const remaining = total - elapsed;
    
    return Math.max(0, Math.round(remaining));
  }, [exportStartTime]);

  // エフェクト削除
  const handleRemoveEffect = useCallback((id: string) => {
    if (!manager) return;

    try {
      manager.removeEffect(id);
      if (selectedEffectId === id) {
        setSelectedEffectId(undefined);
      }
    } catch (error) {
      handleError(error);
    }
  }, [manager, selectedEffectId, handleError]);

  // エフェクトを上に移動
  const handleMoveEffectUp = useCallback((id: string) => {
    if (!manager) return;

    try {
      manager.moveEffectUp(id);
    } catch (error) {
      handleError(error);
    }
  }, [manager, handleError]);

  // エフェクトを下に移動
  const handleMoveEffectDown = useCallback((id: string) => {
    if (!manager) return;

    try {
      manager.moveEffectDown(id);
    } catch (error) {
      handleError(error);
    }
  }, [manager, handleError]);

  // エフェクトリストの取得と状態管理
  const effectEntries = useMemo(() => {
    if (!manager) return [];
    return Array.from(manager.getEffects().entries());
  }, [manager]);

  // 選択中のエフェクトの設定を取得
  const selectedEffect = useMemo(() => {
    if (!selectedEffectId || !manager) return undefined;
    const effect = manager.getEffect(selectedEffectId);
    return effect?.getConfig() as EffectConfig | undefined;
  }, [selectedEffectId, manager]);

  // エラー状態に応じた表示の制御
  if (appError) {
    return (
      <div className="error-screen">
        <h2>エラーが発生しました</h2>
        <p>{appError.message}</p>
        <button onClick={handleCloseError}>閉じる</button>
      </div>
    );
  }

  return (
    <div className="app">
      {/* ヘッダー */}
      <header className="header">
        <h1>WIPMV Maker</h1>
        <div className="controls">
          <input type="file" accept="audio/*" onChange={handleFileUpload} />
          <button onClick={handlePlayPause} disabled={!audioFile || isEncoding}>
            {isPlaying ? '一時停止' : '再生'}
          </button>
          {isEncoding ? (
            <div className="export-progress">
              <div className="progress-info">
                <span>エクスポート中...</span>
                {getRemainingTime(progress) !== null && (
                  <span className="remaining-time">
                    残り約{getRemainingTime(progress)}秒
                  </span>
                )}
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <button
                className="cancel-button"
                onClick={handleCancelExport}
              >
                キャンセル
              </button>
            </div>
          ) : (
            <button onClick={handleExport} disabled={!audioFile}>
              エクスポート
            </button>
          )}
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="main">
        {/* エフェクトツールバー */}
        <div className="toolbar">
          <div className="toolbar-header">
            <h3>エフェクト</h3>
            <div className="toolbar-actions">
              <button onClick={() => handleAddEffect(EffectType.Background)}>背景</button>
              <button onClick={() => handleAddEffect(EffectType.Text)}>テキスト</button>
              <button onClick={() => handleAddEffect(EffectType.Waveform)}>波形</button>
              <button onClick={() => handleAddEffect(EffectType.Watermark)}>ウォーターマーク</button>
            </div>
          </div>
          <div className="effect-list">
            {effectEntries.map(([id, effect]) => (
              <div
                key={id}
                className={`effect-item ${selectedEffectId === id ? 'selected' : ''}`}
                onClick={() => setSelectedEffectId(id)}
              >
                <div className="effect-info">
                  <span className="effect-type">{effect.getConfig().type}</span>
                  <div className="effect-actions">
                    <button
                      className="effect-move"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveEffectUp(id);
                      }}
                      title="上に移動"
                    >
                      ↑
                    </button>
                    <button
                      className="effect-move"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveEffectDown(id);
                      }}
                      title="下に移動"
                    >
                      ↓
                    </button>
                    <button
                      className="effect-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveEffect(id);
                      }}
                      title="削除"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {effectEntries.length === 0 && (
              <div className="no-effects">
                エフェクトを追加してください
              </div>
            )}
          </div>
        </div>

        {/* プレビュー */}
        <div className="preview">
          <canvas
            ref={canvasRef}
            id="preview-canvas"
            width={1280}
            height={720}
            style={{ backgroundColor: '#000' }}
          />
          <audio
            ref={audioRef}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
          />
        </div>

        {/* インスペクター */}
        <div className="inspector">
          <Inspector
            selectedEffect={selectedEffect}
            onEffectChange={handleEffectChange}
          />
        </div>
      </main>

      {/* エラー表示 */}
      {(appError || encoderError) && (
        <div className="error-message">
          <span>{appError?.message || (encoderError instanceof Error ? encoderError.message : encoderError)}</span>
          <button onClick={handleCloseError}>×</button>
        </div>
      )}

      {/* スタイル */}
      <style>{`
        .app {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #1a1a1a;
          color: #ffffff;
        }

        .header {
          padding: 1rem;
          background: #2a2a2a;
          border-bottom: 1px solid #3a3a3a;
        }

        .controls {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .main {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 1rem;
          padding: 1rem;
          flex: 1;
          overflow: hidden;
        }

        .toolbar {
          display: flex;
          flex-direction: column;
          width: 240px;
          background: #2a2a2a;
          border-radius: 4px;
          overflow: hidden;
        }

        .toolbar-header {
          padding: 1rem;
          border-bottom: 1px solid #3a3a3a;
        }

        .toolbar-header h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          font-weight: normal;
          color: #ffffff;
        }

        .toolbar-actions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }

        .effect-list {
          flex: 1;
          overflow-y: auto;
          padding: 0.5rem;
        }

        .effect-item {
          padding: 0.5rem;
          background: #3a3a3a;
          border-radius: 2px;
          margin-bottom: 0.5rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .effect-item:hover {
          background: #4a4a4a;
        }

        .effect-item.selected {
          background: #5a5a5a;
        }

        .effect-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .effect-type {
          font-size: 0.9rem;
          color: #ffffff;
        }

        .effect-actions {
          display: flex;
          gap: 0.25rem;
        }

        .effect-move {
          padding: 0.25rem 0.5rem;
          font-size: 0.8rem;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 2px;
          color: #ffffff;
          cursor: pointer;
          transition: background 0.2s;
        }

        .effect-move:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .effect-remove {
          padding: 0.25rem 0.5rem;
          font-size: 0.8rem;
          background: rgba(255, 68, 68, 0.2);
          border: none;
          border-radius: 2px;
          color: #ff4444;
          cursor: pointer;
          transition: background 0.2s;
        }

        .effect-remove:hover {
          background: rgba(255, 68, 68, 0.3);
        }

        .preview {
          position: relative;
          background: #000000;
          border-radius: 4px;
          overflow: hidden;
        }

        .inspector {
          width: 300px;
          padding: 1rem;
          background: #2a2a2a;
          border-radius: 4px;
        }

        .no-selection {
          color: #888888;
          text-align: center;
          padding: 2rem;
        }

        .error {
          position: fixed;
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          cursor: pointer;
        }

        .error-content {
          padding: 1rem;
          background: rgba(255, 68, 68, 0.95);
          color: white;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          gap: 1rem;
          max-width: 600px;
        }

        .error-message {
          flex: 1;
          font-size: 0.9rem;
        }

        .error-close {
          padding: 0.25rem 0.5rem;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 2px;
          color: white;
          cursor: pointer;
          font-size: 0.8rem;
        }

        .error-close:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        button {
          padding: 0.5rem 1rem;
          background: #3a3a3a;
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
          transition: background 0.2s;
        }

        button:hover {
          background: #4a4a4a;
        }

        button:disabled {
          background: #2a2a2a;
          color: #666666;
          cursor: not-allowed;
        }

        .no-effects {
          padding: 1rem;
          text-align: center;
          color: #666666;
          font-size: 0.9rem;
        }

        .export-progress {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          min-width: 300px;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
        }

        .remaining-time {
          color: #888888;
        }

        .progress-bar-container {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          background: #4a9eff;
          border-radius: 2px;
          transition: width 0.2s ease-out;
        }

        .cancel-button {
          padding: 0.25rem 0.5rem;
          font-size: 0.8rem;
          background: rgba(255, 68, 68, 0.2);
          border: none;
          border-radius: 2px;
          color: #ff4444;
          cursor: pointer;
          transition: background 0.2s;
          align-self: flex-end;
        }

        .cancel-button:hover {
          background: rgba(255, 68, 68, 0.3);
        }

        .controls {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
      `}</style>
    </div>
  );
}

export default App;
