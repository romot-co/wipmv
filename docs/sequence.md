sequenceDiagram
    participant User as User
    participant AudioUploader as AudioUploader<br>(AudioUploader.tsx)
    participant AudioPlaybackService as AudioPlaybackService<br>(AudioPlaybackService.ts)
    participant App as App.tsx
    participant EffectManager as EffectManager<br>(EffectManager.ts)
    participant WaveformEffect as WaveformEffect<br>(WaveformEffect.ts)
    participant Worker as waveformAnalysis.worker.ts
    participant PreviewCanvas as PreviewCanvas<br>(PreviewCanvas.tsx)
    participant VideoEncoderService as VideoEncoderService<br>(VideoEncoderService.ts)
    participant MP4Muxer as MP4Muxer<br>(MP4Muxer.ts)

    %% === 1. Audio File Load ===
    User->>AudioUploader: 1) オーディオファイルを選択
    AudioUploader->>AudioPlaybackService: decodeFile(file)
    AudioPlaybackService->>AudioPlaybackService: decodeAudioData(arrayBuffer)
    AudioPlaybackService->>App: onAudioLoad() <br>(デコード完了時のコールバック)

    %% === 2. App (Manager Initialization) ===
    App->>EffectManager: new EffectManager(renderer)
    EffectManager->>AudioPlaybackService: connectAudioService()
    EffectManager->>EffectManager: startRenderLoop() <br>(プレビュー描画ループ開始)
    note over EffectManager: <b>プレビュー</b><br>現在時刻やwaveformDataを毎フレーム更新

    %% === 3. Preview (リアルタイム再生) ===
    User->>App: 「再生」ボタン操作 (例: PlaybackControls)
    App->>AudioPlaybackService: play()
    AudioPlaybackService->>AudioPlaybackService: _isPlaying = true

    %% === 4. Waveform (リアルタイム) ===
    EffectManager->>AudioPlaybackService: getWaveformData() (AnalyserNode)
    AudioPlaybackService->>EffectManager: return Float32Array<br>(リアルタイム波形)
    EffectManager->>WaveformEffect: render(params.waveformData)
    WaveformEffect-->>EffectManager: 画面に波形を描画

    %% === 5. Workerでの「オフライン解析」 (analysisMode='offline' の場合) ===
    note over WaveformEffect,Worker: <b>analysisMode = 'offline'</b><br>エンコード前に<br>全サンプル解析
    WaveformEffect->>Worker: postMessage({ type: 'analyze', ... })
    Worker->>WaveformEffect: { peaks, rms } (offlineData)

    %% === 6. Export (オフラインエンコード)
    User->>App: 「エクスポート」ボタン操作 (例: ExportButton)
    App->>EffectManager: stopRenderLoop() <br>(プレビュー停止)
    App->>VideoEncoderService: new VideoEncoderService(config)
    VideoEncoderService->>MP4Muxer: (初期化, video/audio track設定)
    VideoEncoderService->>VideoEncoderService: configure VideoEncoder
    VideoEncoderService->>VideoEncoderService: configure AudioEncoder

    loop フレームごとの書き出し
        App->>EffectManager: manager.updateParams({ currentTime = t, ... })
        EffectManager->>EffectManager: render()
        note over EffectManager,WaveformEffect: analysisMode='offline'<br>→ offlineDataから波形取得

        EffectManager->>WaveformEffect: renderWave(offlineData)
        WaveformEffect-->>EffectManager: 波形を描画

        EffectManager->>VideoEncoderService: encodeVideoFrame(canvas, timestampUsec)
        VideoEncoderService->>MP4Muxer: addVideoChunk()
    end

    %% === 7. Audio Encoding
    loop オーディオデータ分
        VideoEncoderService->>AudioPlaybackService: (AudioBuffer からサンプル取得)
        VideoEncoderService->>MP4Muxer: addAudioChunk(EncodedAudioChunk)
    end

    %% === 8. Finalize MP4
    VideoEncoderService->>VideoEncoderService: flush() (video, audio)
    VideoEncoderService->>MP4Muxer: finalize()
    MP4Muxer-->>VideoEncoderService: Uint8Array (MP4バイナリ)
    VideoEncoderService->>App: 完了 (MP4バイナリを受け取る)

    App->>User: ダウンロード開始 (blob URLに変換してaタグclick)
    note over User: 出力「output.mp4」完成！