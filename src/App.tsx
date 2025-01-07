import React, { ChangeEvent, useRef, useState, useCallback, useEffect } from 'react';
import { AudioAnalyzer } from './services/audio/AudioAnalyzer';
import { VisualEffectManager } from './services/effects/VisualEffectManager';
import { VideoEncoderService } from './services/encoder/VideoEncoderService';
import { AudioEncoderService } from './services/encoder/AudioEncoderService';
import { MP4Multiplexer } from './services/video/MP4Multiplexer';
import { VideoConfig, AudioConfig, AudioSource } from './types';
import { CanvasRenderer } from './services/effects/CanvasRenderer';
import { EffectManager } from './components/effects/EffectManager';
import { PreviewPlayer } from './components/preview/PreviewPlayer';
import { VisualEffect } from './services/effects/VisualEffect';
import { BackgroundEffectConfig, WaveformEffectConfig, TextEffectData } from './types/effects';
import { TextEffectManager } from './components/TextEffectManager';
import { createMultipleTextEffects } from './services/effects/createTextEffect';
import './components/effects/EffectManager.css';
import './App.css';
import { storageService } from './services/storage/StorageService';
import { extractBackgroundConfig, extractWaveformConfig } from './services/effects/extractEffectConfig';
import { EncoderSettings } from './components/encoder/EncoderSettings';
import { VideoEncoderConfig, AudioEncoderConfig, OutputConfig, encoderPresets } from './types/encoder';
import './components/encoder/EncoderSettings.css';

// ファイルアップローダーコンポーネント
const FileUploader: React.FC<{ onFileUpload: (file: File) => void }> = ({ onFileUpload }) => {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onFileUpload(file);
  };

  return (
    <input
      type="file"
      accept="audio/*"
      onChange={handleFileChange}
    />
  );
};

function App() {
  // 状態管理
  const [width] = useState(960);
  const [height] = useState(600);
  const [frameRate] = useState(30);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [audioSource, setAudioSource] = useState<AudioSource | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [effects, setEffects] = useState<VisualEffect[]>([]);
  const [textEffects, setTextEffects] = useState<TextEffectData[]>([]);

  // Refs
  const audioAnalyzer = useRef<AudioAnalyzer | null>(null);
  const visualEffectManager = useRef(new VisualEffectManager());
  const canvasRenderer = useRef<CanvasRenderer | null>(null);
  const videoEncoder = useRef<VideoEncoderService | null>(null);
  const audioEncoder = useRef<AudioEncoderService | null>(null);

  // エンコード設定のstate
  const [encoderSettings, setEncoderSettings] = useState<{
    video: VideoEncoderConfig;
    audio: AudioEncoderConfig;
    output: OutputConfig;
  }>({
    video: encoderPresets.balanced.video,
    audio: encoderPresets.balanced.audio,
    output: {
      container: 'mp4',
      metadata: {
        title: '',
        artist: '',
        date: new Date().toISOString().split('T')[0],
        comment: ''
      }
    }
  });

  // エンコードーの初期化
  useEffect(() => {
    videoEncoder.current = new VideoEncoderService(encoderSettings.video);
    audioEncoder.current = new AudioEncoderService(encoderSettings.audio);
  }, []);

  // エンコード設定の変更ハンドラ
  const handleEncoderSettingsChange = (settings: {
    video: VideoEncoderConfig;
    audio: AudioEncoderConfig;
    output: OutputConfig;
  }) => {
    setEncoderSettings(settings);
    // エンコーダーの設定を更新
    if (videoEncoder.current) {
      videoEncoder.current = new VideoEncoderService(settings.video);
    }
    if (audioEncoder.current) {
      audioEncoder.current = new AudioEncoderService(settings.audio);
    }
  };

  // 設定の読み込み
  useEffect(() => {
    const loadSavedSettings = async () => {
      try {
        // 背景設定の読み込み
        const savedBackground = await storageService.loadSettings<BackgroundEffectConfig>('background');
        // 波形設定の読み込み
        const savedWaveform = await storageService.loadSettings<WaveformEffectConfig>('waveform');
        // テキスト設定の読み込み
        const savedTextEffects = await storageService.loadSettings<TextEffectData[]>('textEffects');

        // 設定の適用
        const initialEffects: VisualEffect[] = [];
        
        if (savedBackground) {
          // 背景画像の場合は画像データも読み込む
          if (savedBackground.type === 'image') {
            const image = await storageService.loadImage('backgroundImage');
            if (image) {
              savedBackground.image = image;
            }
          }
          // ... 背景エフェクトの作成と追加
        }

        if (savedWaveform) {
          // ... 波形エフェクトの作成と追加
        }

        if (savedTextEffects) {
          setTextEffects(savedTextEffects);
          const textVisualEffects = createMultipleTextEffects(savedTextEffects);
          initialEffects.push(...textVisualEffects);
        }

        handleEffectsChange(initialEffects);
      } catch (err) {
        console.error('設定の読み込み中にエラーが発生:', err);
      }
    };

    loadSavedSettings();
  }, []);

  // オーディオファイルのアップロード処理
  const handleFileUpload = async (file: File) => {
    try {
      if (!audioAnalyzer.current) {
        audioAnalyzer.current = new AudioAnalyzer(frameRate);
      }
      const source = await audioAnalyzer.current.processAudio(file);
      if (source) {
        setAudioSource(source);
        setError(null);
      }
    } catch (err) {
      setError('オーディオファイルの処理中にエラーが発生しました');
      console.error(err);
    }
  };

  // エフェクト変更のハンドラー
  const handleEffectsChange = useCallback((newEffects: VisualEffect[]) => {
    setEffects(newEffects);
    visualEffectManager.current = new VisualEffectManager();
    newEffects.forEach(effect => {
      visualEffectManager.current.registerEffect(effect);
    });

    // 設定の保存
    const backgroundEffect = newEffects.find(effect => effect.getName() === 'background');
    const waveformEffect = newEffects.find(effect => effect.getName() === 'waveform');

    if (backgroundEffect) {
      const config = extractBackgroundConfig(backgroundEffect);
      storageService.saveSettings({ background: config });

      // 背景画像の保存
      if (config.type === 'image' && config.image) {
        storageService.saveImage('backgroundImage', config.image);
      }
    }

    if (waveformEffect) {
      const config = extractWaveformConfig(waveformEffect);
      storageService.saveSettings({ waveform: config });
    }
  }, []);

  // テキストエフェクト変更のハンドラー
  const handleTextEffectsChange = useCallback((newTextEffects: TextEffectData[]) => {
    setTextEffects(newTextEffects);
    const textVisualEffects = createMultipleTextEffects(newTextEffects);
    
    // 既存のエフェクトを保持しながら、テキストエフェクトのみを更新
    const nonTextEffects = effects.filter(effect => !effect.getName().startsWith('text-'));
    const newEffects = [...nonTextEffects, ...textVisualEffects];
    
    handleEffectsChange(newEffects);

    // テキスト設定の保存
    storageService.saveSettings({ textEffects: newTextEffects });
  }, [effects, handleEffectsChange]);

  // 動画生成処理
  const generateVideo = async () => {
    if (!audioSource) return;

    setIsGenerating(true);
    setError(null);

    try {
      // キャンバスレンダラーの初期化
      canvasRenderer.current = new CanvasRenderer(width, height, frameRate);

      // エンコーダーとマルチプレクサーの設定
      const videoConfig: VideoConfig = {
        codec: 'avc1.64001F',
        width,
        height,
        bitrate: 2_000_000,
        framerate: frameRate
      };

      const audioConfig: AudioConfig = {
        codec: 'mp4a.40.2',
        sampleRate: audioSource.sampleRate,
        numberOfChannels: audioSource.numberOfChannels,
        bitrate: 192_000
      };

      const multiplexer = new MP4Multiplexer(videoConfig, audioConfig);

      const videoEncoder = new VideoEncoderService({
        ...videoConfig,
        onEncodedChunk: (chunk: EncodedVideoChunk, meta: EncodedVideoChunkMetadata) => {
          multiplexer.addVideoChunk(chunk, meta);
        }
      });

      const audioEncoder = new AudioEncoderService({
        ...audioConfig,
        onEncodedChunk: (chunk: EncodedAudioChunk, meta: EncodedAudioChunkMetadata) => {
          multiplexer.addAudioChunk(chunk, meta);
        }
      });

      await videoEncoder.initialize();
      await audioEncoder.initialize();

      // フレームの生成とエンコード
      const duration = audioSource.duration;
      const totalFrames = Math.ceil(duration * frameRate);

      for (let frame = 0; frame < totalFrames; frame++) {
        const time = (frame / frameRate) * 1000;
        canvasRenderer.current.render(audioSource, time, visualEffectManager.current);
        
        const videoFrame = new VideoFrame(canvasRenderer.current.getCanvas(), {
          timestamp: time * 1000
        });
        
        await videoEncoder.encodeFrame(videoFrame, { keyFrame: frame % 150 === 0 });
        videoFrame.close();
      }

      // オーディオのエンコード
      const frameSize = 1024;
      const numberOfFrames = audioSource.timeData[0].length;
      let offset = 0;

      while (offset < numberOfFrames) {
        const chunkData = new Float32Array(frameSize * audioSource.numberOfChannels);

        for (let i = 0; i < frameSize && offset + i < numberOfFrames; i++) {
          for (let channel = 0; channel < audioSource.numberOfChannels; channel++) {
            chunkData[i * audioSource.numberOfChannels + channel] = audioSource.timeData[channel][offset + i];
          }
        }

        const audioData = new AudioData({
          format: 'f32',
          sampleRate: audioSource.sampleRate,
          numberOfFrames: frameSize,
          numberOfChannels: audioSource.numberOfChannels,
          timestamp: offset / audioSource.sampleRate * 1_000_000,
          data: chunkData,
        });

        await audioEncoder.encodeAudio(audioData);
        audioData.close();
        offset += frameSize;
      }

      // エンコーダーのフラッシュと最終化
      await Promise.all([
        videoEncoder.flush(),
        audioEncoder.flush()
      ]);

      const mp4Data = multiplexer.finalize();
      const blob = new Blob([mp4Data], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      setVideoURL(url);

    } catch (err) {
      console.error('動画生成中にエラーが発生:', err);
      setError('動画生成中にエラーが発生しました');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="app">
      <div className="app-header">
        <h1>WIP MV Maker</h1>
      </div>
      <div className="app-content">
        <div className="main-section">
          <section className="upload-section">
            <h2>オーディオファイルのアップロード</h2>
            <FileUploader onFileUpload={handleFileUpload} />
          </section>

          <section className="preview-section">
            <PreviewPlayer
              audioSource={audioSource}
              effects={effects}
              width={width}
              height={height}
            />
          </section>

          <section className="generate-section">
            <button
              onClick={generateVideo}
              disabled={!audioSource || isGenerating}
            >
              {isGenerating ? '生成中...' : '動画を生成'}
            </button>
          </section>

          {error && (
            <section className="error-section">
              <p className="error">{error}</p>
            </section>
          )}

          {videoURL && (
            <section className="video-section">
              <h2>生成された動画</h2>
              <video src={videoURL} controls />
              <a href={videoURL} download="visualizer.mp4" className="download-button">
                動画をダウンロード
              </a>
            </section>
          )}
        </div>

        <div className="settings-section">
          <div className="effect-settings">
            <EffectManager
              onEffectsChange={handleEffectsChange}
              initialEffects={{
                background: {
                  type: 'color',
                  color: '#000000',
                  opacity: 1
                } as BackgroundEffectConfig,
                waveform: {
                  type: 'waveform',
                  color: '#ffffff',
                  lineWidth: 2,
                  height: 100,
                  opacity: 1
                } as WaveformEffectConfig
              }}
            />
            <TextEffectManager onTextEffectsChange={handleTextEffectsChange} />
          </div>
          <div className="encoder-settings-wrapper">
            <EncoderSettings onSettingsChange={handleEncoderSettingsChange} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
