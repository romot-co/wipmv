import React, { useRef, useState, useCallback, useEffect } from 'react';
import { PlaybackControls } from './ui/PlaybackControls';
import { EffectList } from './ui/EffectList';
import { EffectSettings } from './ui/EffectSettings';
import { AddEffectButton } from './ui/AddEffectButton';
import { useAudioControl } from './hooks/useAudioControl';
import { useVideoEncoder } from './hooks/useVideoEncoder';
import { EncoderConfig } from './core/VideoEncoderService';
import { AudioSource, EffectConfig } from './core/types';
import { EffectManager } from './core/EffectManager';
import { AudioPlaybackService } from './core/AudioPlaybackService';
import { Renderer } from './core/Renderer';
import './App.css';

interface AudioUploaderProps {
  audioService: AudioPlaybackService;
  onAudioLoad: () => void;
}

const AudioUploader: React.FC<AudioUploaderProps> = ({ audioService, onAudioLoad }) => {
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await audioService.decodeFile(file);
      onAudioLoad();
    } catch (error) {
      console.error('Failed to decode audio file:', error);
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

const ExportButton: React.FC<{ audioService: AudioPlaybackService; manager: EffectManager }> = ({
  audioService,
  manager
}) => {
  const { isEncoding, progress, startEncoding } = useVideoEncoder();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleExport = useCallback(async () => {
    if (!canvasRef.current) return;

    // AudioBufferの取得
    const audioBuffer = audioService.getAudioBuffer();
    if (!audioBuffer) return;

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

    await startEncoding(
      canvasRef.current,
      audioSource,
      manager,
      config
    );
  }, [startEncoding, audioService, manager]);

  return (
    <button 
      className="export-button"
      onClick={handleExport}
      disabled={isEncoding}
    >
      {isEncoding ? `エクスポート中... ${progress}%` : 'エクスポート'}
    </button>
  );
};

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const [selectedEffectId, setSelectedEffectId] = useState<string>();
  const [audioService] = useState(() => new AudioPlaybackService());
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const [manager, setManager] = useState<EffectManager | null>(null);

  // Rendererの初期化
  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new Renderer(canvasRef.current);
    }
  }, []);

  // EffectManagerの初期化
  useEffect(() => {
    if (rendererRef.current && !manager) {
      const newManager = new EffectManager(rendererRef.current);
      setManager(newManager);
      return () => {
        newManager.dispose();
      };
    }
  }, [rendererRef.current]);

  const {
    currentTime,
    isPlaying,
    duration,
    play,
    pause,
    stop,
    seek,
    getAnalyser
  } = useAudioControl({ 
    manager,
    audioService
  });

  const handleEffectUpdate = useCallback((config: Partial<EffectConfig>) => {
    if (!manager || !selectedEffectId) return;
    manager.updateEffect(selectedEffectId, config);
    manager.render();
  }, [manager, selectedEffectId]);

  // オーディオファイルがない場合は初期画面を表示
  if (!isAudioLoaded || !duration) {
    return (
      <div className="app app--empty">
        <AudioUploader 
          audioService={audioService}
          onAudioLoad={() => setIsAudioLoaded(true)}
        />
      </div>
    );
  }

  // AudioSourceの取得
  const analyser = getAnalyser();
  if (!analyser || !manager) return null;

  // 選択中のエフェクトを取得
  const selectedEffect = selectedEffectId
    ? manager.getEffects().find(e => e.getConfig().id === selectedEffectId)
    : undefined;

  return (
    <div className="app">
      {/* ヘッダー */}
      <header className="app-header">
        <AudioUploader 
          audioService={audioService}
          onAudioLoad={() => setIsAudioLoaded(true)}
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
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="preview-canvas"
          />
          <PlaybackControls
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onPlay={async () => await play()}
            onPause={async () => await pause()}
            onStop={async () => await stop()}
            onSeek={async (time) => await seek(time)}
          />
        </section>

        {/* エフェクト管理パネル */}
        <section className="effect-panel">
          <div className="effect-list">
            <AddEffectButton manager={manager} />
            <EffectList
              manager={manager}
              selectedEffectId={selectedEffectId}
              onEffectSelect={setSelectedEffectId}
              onEffectRemove={(id) => {
                if (manager) {
                  manager.removeEffect(id);
                  if (id === selectedEffectId) {
                    setSelectedEffectId(undefined);
                  }
                }
              }}
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