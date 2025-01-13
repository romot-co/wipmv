import React, { useRef, useState, useCallback, useEffect } from 'react';
import { PlaybackControls } from './ui/PlaybackControls';
import { EffectList } from './ui/EffectList';
import { EffectSettings } from './ui/EffectSettings';
import { AddEffectButton } from './ui/AddEffectButton';
import { PreviewCanvas } from './ui/PreviewCanvas';
import { useAudioControl } from './hooks/useAudioControl';
import { useVideoEncoder } from './hooks/useVideoEncoder';
import { EncoderConfig } from './core/VideoEncoderService';
import { AudioSource, EffectConfig, EffectType } from './core/types';
import { EffectManager } from './core/EffectManager';
import { AudioPlaybackService } from './core/AudioPlaybackService';
import { EffectBase } from './core/EffectBase';
import { BackgroundEffect } from './features/background/BackgroundEffect';
import { TextEffect } from './features/text/TextEffect';
import { WaveformEffect } from './features/waveform/WaveformEffect';
import { WatermarkEffect } from './features/watermark/WatermarkEffect';
import './App.css';

interface AudioUploaderProps {
  audioService: AudioPlaybackService;
  onAudioLoad: () => void;
  onError?: (error: Error) => void;
}

const AudioUploader: React.FC<AudioUploaderProps> = ({ 
  audioService, 
  onAudioLoad,
  onError 
}) => {
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await audioService.decodeFile(file);
      onAudioLoad();
    } catch (error) {
      console.error('Failed to decode audio file:', error);
      onError?.(error instanceof Error ? error : new Error('オーディオファイルの読み込みに失敗しました'));
    }
  };

  return (
    <div className="audio-uploader">
      <input
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="file-input"
      />
    </div>
  );
};

const ExportButton: React.FC<{ audioService: AudioPlaybackService; manager: EffectManager | null }> = ({
  audioService,
  manager
}) => {
  const { isEncoding, progress, startEncoding } = useVideoEncoder();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleExport = useCallback(async () => {
    if (!canvasRef.current || !manager) {
      console.error('エクスポートに必要な要素が初期化されていません');
      return;
    }

    try {
      // AudioBufferの取得
      const audioBuffer = audioService.getAudioBuffer();
      if (!audioBuffer) {
        console.error('オーディオバッファが見つかりません');
        return;
      }

      console.log('エクスポート開始:', {
        audioBuffer,
        canvas: canvasRef.current,
        manager
      });

      const config: EncoderConfig = {
        width: 800,
        height: 600,
        frameRate: 30,
        videoBitrate: 5_000_000,
        audioBitrate: 128_000,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels
      };

      const audioSource: AudioSource = {
        buffer: audioBuffer,
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels,
        duration: audioBuffer.duration
      };

      const blob = await startEncoding(
        canvasRef.current,
        audioSource,
        manager,
        config
      );

      if (blob) {
        // ダウンロードリンクを作成
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export-${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('エクスポート中にエラーが発生しました:', error);
    }
  }, [startEncoding, audioService, manager]);

  return (
    <div className="export-button-container">
      <canvas ref={canvasRef} style={{ display: 'none' }} width={960} height={600} />
      <button 
        className="export-button"
        onClick={handleExport}
        disabled={isEncoding || !manager}
      >
        {isEncoding ? `エクスポート中... ${progress}%` : 'エクスポート'}
      </button>
    </div>
  );
};

export const App: React.FC = () => {
  const [selectedEffectId, setSelectedEffectId] = useState<string>();
  const [audioService] = useState(() => new AudioPlaybackService());
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const [manager, setManager] = useState<EffectManager | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [effects, setEffects] = useState<EffectBase[]>([]);

  const handleManagerInit = useCallback((newManager: EffectManager) => {
    console.log('EffectManager初期化:', newManager);
    setManager(newManager);
  }, []);

  const handleEffectAdd = useCallback((type: EffectType) => {
    if (!manager) return;

    const zIndex = manager.getEffects().length;
    let effect: EffectBase;

    switch (type) {
      case EffectType.Background:
        effect = new BackgroundEffect({
          id: `background-${Date.now()}`,
          type: EffectType.Background,
          backgroundType: 'color',
          color: '#000000',
          zIndex,
          visible: true
        });
        break;
      case EffectType.Text:
        effect = new TextEffect({
          id: `text-${Date.now()}`,
          type: EffectType.Text,
          text: 'テキスト',
          style: {
            fontSize: 24,
            fontFamily: 'sans-serif',
            color: '#ffffff'
          },
          position: { x: 100, y: 100 },
          zIndex,
          visible: true
        });
        break;
      case EffectType.Waveform:
        effect = new WaveformEffect({
          id: `waveform-${Date.now()}`,
          type: EffectType.Waveform,
          position: { x: 0, y: 0, width: 800, height: 200 },
          colors: {
            primary: '#ffffff'
          },
          zIndex,
          visible: true
        });
        break;
      case EffectType.Watermark:
        effect = new WatermarkEffect({
          id: `watermark-${Date.now()}`,
          type: EffectType.Watermark,
          imageUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
          position: { x: 50, y: 50, width: 100, height: 100 },
          style: {
            opacity: 0.5,
            blendMode: 'source-over'
          },
          zIndex,
          visible: true
        });
        break;
    }

    manager.addEffect(effect);
    setEffects(manager.getEffects());
  }, [manager]);

  const handleEffectRemove = useCallback((id: string) => {
    if (!manager) return;
    manager.removeEffect(id);
    setEffects(manager.getEffects());
    if (selectedEffectId === id) {
      setSelectedEffectId(undefined);
    }
  }, [manager, selectedEffectId]);

  const handleEffectMove = useCallback((id: string, direction: 'up' | 'down') => {
    if (!manager) return;
    if (direction === 'up') {
      manager.moveEffectUp(id);
    } else {
      manager.moveEffectDown(id);
    }
    setEffects(manager.getEffects());
  }, [manager]);

  const handleEffectUpdate = useCallback((config: Partial<EffectConfig>) => {
    if (!manager || !selectedEffectId) return;
    manager.updateEffect(selectedEffectId, config);
    manager.render();
  }, [manager, selectedEffectId]);

  const {
    currentTime,
    isPlaying,
    duration,
    play,
    pause,
    stop,
    seek,
    getAnalyser,
    getWaveformData,
    getFrequencyData
  } = useAudioControl({ 
    manager,
    audioService
  });

  // エフェクトの状態を監視
  useEffect(() => {
    if (!manager) return;
    
    // 初期状態を設定
    setEffects(manager.getEffects());

    // エフェクトが変更されたら再取得
    const interval = setInterval(() => {
      setEffects(manager.getEffects());
    }, 100);

    return () => clearInterval(interval);
  }, [manager]);

  // レンダリングループの制御
  useEffect(() => {
    if (!manager) return;

    if (isPlaying) {
      manager.startRenderLoop();
    } else {
      manager.stopRenderLoop();
      // 停止時は最後の状態を描画
      manager.render();
    }
  }, [manager, isPlaying]);

  // オーディオファイルがない場合は初期画面を表示
  if (!isAudioLoaded || !duration) {
    return (
      <div className="app app--empty">
        <AudioUploader 
          audioService={audioService}
          onAudioLoad={() => {
            setIsAudioLoaded(true);
            setError(null);
          }}
          onError={setError}
        />
        {error && (
          <div className="error-section">
            <p className="error-message">{error.message}</p>
          </div>
        )}
      </div>
    );
  }

  // AudioSourceの取得
  const analyser = getAnalyser();
  if (!analyser) {
    return (
      <div className="app">
        <header className="app-header">
          <AudioUploader 
            audioService={audioService}
            onAudioLoad={() => {
              setIsAudioLoaded(true);
              setError(null);
            }}
            onError={setError}
          />
          <div className="loading-message">
            オーディオ解析を準備中...
          </div>
          {error && (
            <div className="error-section">
              <p className="error-message">{error.message}</p>
            </div>
          )}
        </header>
      </div>
    );
  }

  // 選択中のエフェクトを取得
  const selectedEffect = selectedEffectId && manager
    ? manager.getEffects().find(e => e.getConfig().id === selectedEffectId)
    : undefined;

  return (
    <div className="app">
      {/* ヘッダー */}
      <header className="app-header">
        <AudioUploader 
          audioService={audioService}
          onAudioLoad={() => {
            setIsAudioLoaded(true);
            setError(null);
          }}
          onError={setError}
        />
        <ExportButton
          audioService={audioService}
          manager={manager}
        />
      </header>

      {/* メインコンテンツ */}
      <main className="app-main">
        {/* プレビュー & 再生コントロール */}
        <section className="preview-section">
          <PreviewCanvas
            width={960}
            height={600}
            isPlaying={isPlaying}
            waveformData={getWaveformData()}
            frequencyData={getFrequencyData()}
            onManagerInit={handleManagerInit}
          />
          <PlaybackControls
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onPlay={async () => await play()}
            onPause={async () => await pause()}
            onSeek={async (time) => await seek(time)}
          />
        </section>

        {/* エフェクト管理パネル */}
        <section className="effect-panel">
          <div className="effect-list">
            <AddEffectButton onAdd={handleEffectAdd} />
            <EffectList
              effects={effects}
              selectedEffectId={selectedEffectId}
              onEffectSelect={setSelectedEffectId}
              onEffectRemove={handleEffectRemove}
              onEffectMove={handleEffectMove}
            />
          </div>
          <div className="effect-settings">
            {selectedEffect && (
              <EffectSettings
                effect={selectedEffect}
                onUpdate={handleEffectUpdate}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;