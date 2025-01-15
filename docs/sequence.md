sequenceDiagram
    %% Participants (各モジュール・ユーザー)
    participant User as ユーザー
    participant App as App(UI層)
    participant ProjectService as ProjectService<br>(永続化)
    participant AudioPlaybackService as AudioPlaybackService<br>(音声再生)
    participant AudioAnalyzerService as AudioAnalyzerService<br>(オフライン解析)
    participant EffectManager as EffectManager<br>(描画管理)
    participant WaveformEffect as WaveformEffect<br>(各種Effectの一例)
    participant VideoEncoderService as VideoEncoderService<br>(エンコード)
    participant MP4Muxer as MP4Muxer<br>(多重化)

    %% === 1. アプリ起動 & プロジェクトデータ読込 ===
    App->>ProjectService: loadProject()  (IndexedDBからJSON読込)
    ProjectService-->>App: (プロジェクト設定 / エフェクト構成を返却)
    App->>EffectManager: manager.init(projectData.effects)
    Note right of App: すでに保存済みのエフェクトを復元

    %% === 2. ユーザーが音声ファイルを選択/ドロップ ===
    User->>App: (ファイルをアップロード)
    App->>AudioPlaybackService: loadAudio(file)
    AudioPlaybackService->>AudioPlaybackService: decodeAudioData()
    AudioPlaybackService-->>App: onAudioLoadComplete(duration)

    %% === 3. 波形解析(オフライン/必要に応じ) ===
    App->>AudioAnalyzerService: analyzeOffline(audioBuffer)
    AudioAnalyzerService->>AudioAnalyzerService: FFT/ピーク抽出/WebWorker等で解析
    AudioAnalyzerService-->>App: (解析結果Data)
    App->>WaveformEffect: waveformEffect.setData(解析結果)

    %% === 4. プレビュー開始 ===
    Note over App,EffectManager: requestAnimationFrame ループ開始
    loop 毎フレーム
        App->>AudioPlaybackService: getCurrentTime()
        AudioPlaybackService-->>App: currentTime
        App->>EffectManager: render(currentTime, previewCanvas)
        EffectManager->>WaveformEffect: (startTime <= currentTime < endTime?)<br>必要なら描画
        WaveformEffect-->>EffectManager: (描画完了)
    end

    %% === 5. ユーザーがエフェクト編集 ===
    User->>App: (UI上でエフェクト設定を変更)
    App->>EffectManager: manager.updateEffectConfig(effectId, config)
    App->>ProjectService: saveProject(updatedProjectData)
    Note right of App: 変更のたびに自動保存

    %% === 6. 再生操作 ===
    User->>App: (再生ボタン)
    App->>AudioPlaybackService: play()
    Note over AudioPlaybackService: AudioContext で再生開始
    Note over App,EffectManager: 以後、再生中は<br>currentTimeが進行

    %% === 7. エクスポート (動画生成)===
    User->>App: (Exportボタンを押す)
    App->>VideoEncoderService: startEncode(videoSettings)
    Note over VideoEncoderService: WebCodecs & mp4-muxer初期化

    loop 全フレーム (音声の長さ分)
        App->>EffectManager: render(frameTime, encodeCanvas)
        EffectManager->>WaveformEffect: waveformEffect.render() (任意)
        EffectManager-->>App: (フレーム描画結果)
        App->>VideoEncoderService: encodeVideoFrame(encodeCanvas, frameTime)
        VideoEncoderService->>MP4Muxer: addVideoChunk(encodedVideoChunk)
    end

    %% === 8. オーディオデータ(エンコード) ===
    VideoEncoderService->>AudioPlaybackService: getAudioSamples()
    AudioPlaybackService-->>VideoEncoderService: (音声サンプル)
    VideoEncoderService->>MP4Muxer: addAudioChunk(encodedAudioChunk)

    %% === 9. エクスポート完了 ===
    VideoEncoderService->>MP4Muxer: finalize()
    MP4Muxer-->>VideoEncoderService: mp4Binary(Uint8Array)
    VideoEncoderService-->>App: (エンコード完了, MP4バイナリ)
    App->>User: ダウンロード (Blob URL)

    Note over User: 完成した動画を入手！