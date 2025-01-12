prompt.md

はじめに

本プロジェクトの目的は、任意のオーディオファイルをアップロードし、背景・テキスト・波形・ウォーターマークなどのビジュアルエフェクトを合成して、MP4 動画をエクスポートできるアプリケーションを開発することです。
仕様書に基づいて、アプリ全体の構成方針・ディレクトリ構成・機能概要・アーキテクチャのポイント・実装ステップなどをまとめました。以下の指示に従って実装を進めてください。

1. アーキテクチャ概観
	1.	フロントエンド技術スタック
	•	React + TypeScript + Vite で開発する。
	•	ビルドは Vite を用い、ホットリロードなどを活用する。
	2.	動画エンコードまわり
	•	WebCodecs API を活用し、ブラウザ上で映像/音声エンコードを行う。
	•	オフスクリーンCanvasを積極的に利用して描画の効率化を図る（互換性は気にしなくてよい）。
	3.	Canvas (2D)
	•	WebGL は初期段階では不要。2D Canvas で描画し、負荷が大きくなったら将来的に WebGL へ移行可能な設計にする。
	4.	MP4形式の多重化
	•	mp4-muxer ライブラリを使用し、エンコードされた映像チャンクと音声チャンクを最終的に MP4 にまとめる。

2. ディレクトリ構成・役割

src/
├── main.tsx              // Reactエントリーポイント
├── App.tsx               // アプリのルートUIコンポーネント
├── core/                 // コア機能（エフェクト基盤、エンコード関連、再生関連） 
│   ├── types.ts
│   ├── EffectBase.ts
│   ├── EffectManager.ts
│   ├── Renderer.ts
│   ├── VideoEncoderService.ts
│   ├── AudioPlaybackService.ts
│   ├── MP4Muxer.ts
│   └── …
├── hooks/                // React Hooks (カスタムフック) 
│   └── ...
├── features/             // 各エフェクトの実装 & UI
│   ├── background/
│   ├── text/
│   ├── waveform/
│   └── watermark/
├── ui/                   // 共通UIや画面パーツ
│   ├── PreviewCanvas.tsx
│   ├── EffectList.tsx
│   ├── EffectSettings.tsx
│   ├── PlaybackControls.tsx
│   └── ...
├── utils/                // オーディオユーティリティなど
│   └── audioUtils.ts
└── ...

	•	core/:
	•	EffectBase.ts: エフェクトの基底クラス
	•	EffectManager.ts: 複数エフェクトを一元管理し、描画タイミング等を制御
	•	Renderer.ts: オフスクリーン＋メインCanvasへの描画
	•	VideoEncoderService.ts & MP4Muxer.ts: WebCodecs でエンコードしたチャンクを MP4 に多重化
	•	AudioPlaybackService.ts: 音声再生と AnalyserNode を使った波形解析
	•	features/:
	•	background / text / waveform / watermark の各フォルダに、
	•	XxxEffect.ts (エフェクトのロジック)
	•	XxxSettings.tsx (設定UI)
を配置。
	•	例: BackgroundEffect.ts, BackgroundSettings.tsx
	•	ui/:
	•	PreviewCanvas.tsx: プレビュー表示用Canvas
	•	EffectList.tsx: 有効なエフェクト一覧
	•	EffectSettings.tsx: 選択エフェクトの設定パネル
	•	PlaybackControls.tsx: 再生・停止・シーク操作UI
	•	utils/:
	•	共通的なオーディオ処理やデータ解析関数をまとめる

3. 各機能・モジュールの仕様
	1.	オーディオ解析 (AudioPlaybackService / hooks/useAudioControl など)
	•	オーディオをアップロードし AudioContext.decodeAudioData() で AudioBuffer を取得。
	•	AnalyserNode を用いてリアルタイムに波形や周波数データを取得可能に。
	2.	エフェクトクラス (EffectBase継承)
	•	render(ctx, params) メソッドで Canvas に描画。
	•	isVisible(currentTime) により再生中の時刻に応じて表示/非表示を制御。
	•	updateConfig() でUI側から受け取った設定を反映。
	3.	EffectManager
	•	エフェクトの追加/削除、zIndexによるソート、Canvas描画呼び出しなどを担う。
	•	render() で全エフェクトを描画 → Rendererに転送 → メインCanvasに反映。
	4.	エンコード & エクスポート (VideoEncoderService, MP4Muxer)
	•	音声: AudioEncoder で AAC などにエンコード
	•	映像: VideoEncoder でフレーム単位にエンコード
	•	mp4-muxer で多重化して最終的にMP4を生成し、Blobダウンロードまたはファイル出力。
	5.	UI のポイント
	•	PreviewCanvas.tsx:
	•	EffectManager と連携し、再生状態 (currentTime など) に合わせて描画を更新。
	•	EffectSettings.tsx:
	•	選択中エフェクトの種類に応じて設定UIを切り替える (背景かテキストか波形かウォーターマークか)。
	•	EffectList.tsx:
	•	追加済みエフェクトをリスト表示し、選択・削除・上下移動を行う。
	•	PlaybackControls.tsx:
	•	再生/停止/シーク可能な操作UI。

4. 実装ステップ

ここでは、大まかなフローを示します。すでにあるファイル構成を前提に、追加・修正が必要なポイントを整理してください。
	1.	Audioのアップロード & デコードフロー
	1.	hooks/useAudioSource.ts や useAudioData.ts を使い、ファイルを読み込む。
	2.	AudioContext.decodeAudioData() でデコードした AudioBuffer をグローバル or Context等で保持。
	3.	波形・周波数データを解析して、PreviewCanvas や EffectManager に渡す。
	2.	EffectManager / Renderer の初期化
	1.	PreviewCanvas.tsx で EffectManager をインスタンス化し、onManagerInit コールバックで App.tsx へ渡す。
	2.	EffectManager は Renderer を内部的に使ってオフスクリーン→メインCanvasの描画を行う。
	3.	App.tsx 側でエフェクトを追加 (manager.addEffect(...))。 背景エフェクトをデフォルト追加する例が多い。
	3.	エフェクト追加機能 (features/〇〇)
	•	背景 (BackgroundEffect), テキスト (TextEffect), 波形 (WaveformEffect), ウォーターマーク (WatermarkEffect) を用意。
	•	EffectBase を継承し、render() の中で具体的な描画ロジックを実装。
	•	設定用のUI (XxxSettings.tsx) でユーザーが入力した値を updateConfig() に反映。
	4.	プレビュー & 再生同期
	1.	PlaybackControls で再生ボタン→ AudioContext を再開 → currentTime の更新。
	2.	EffectManager に currentTime を与え、render(currentTime) する。
	3.	波形データが必要な場合は AnalyserNode から取得し、manager.updateAudioData(waveform, frequency) などで共有。
	5.	動画エンコード & エクスポート
	1.	VideoEncoderService をインスタンス化し initialize()。
	2.	30fps など設定したフレーム数だけ manager.setCurrentTime(t) → manager.render() → canvas -> VideoFrame でエンコード。
	3.	同様に AudioEncoder による音声エンコードを行い、MP4Muxer で多重化。
	4.	finalize() で得られた MP4 バイナリを Blob に変換し、URL.createObjectURL + <a download> などでダウンロード処理。
	6.	テスト
	•	単体テスト: EffectBase / EffectManager / XxxEffect のレンダリングや設定反映
	•	E2Eテスト:
	1.	ファイルアップロード→エフェクト追加・設定→プレビュー→エンコード→ダウンロード
	2.	ファイルサイズの大きい場合や、波形量が多い場合も含め動作チェック
	7.	パフォーマンス検証
	•	まずは 2D Canvas + OffscreenCanvas 実装で十分。
	•	フレーム落ちするほど重たくなったら、WebGLレンダラーを検討。

5. 補足・実装上の注意
	•	オーバーエンジニアリングを避ける
シンプルな構成を保ち、必要最小限の機能から実装を始める。
	•	OffscreenCanvas 非対応ブラウザはサポート外
この割り切りにより、最新ブラウザでの動作に集中できる。
	•	プラグイン拡張性
features/ 下に新しいエフェクトを追加しやすい構成を維持する。
	•	zIndex
エフェクトの重なり順は EffectManager が管理。UI から変更可にする場合は moveUp / moveDown メソッドなどを用意。

6. 実装時にやるべきこと一覧（チェックリスト）
	1.	Audio 読み込み
	•	File input で音声ファイルを受け取り、AudioBuffer を生成。
	•	失敗時の例外処理・エラー表示。
	2.	EffectManager / Renderer
	•	Manager の初期化と PreviewCanvas.tsx への紐付け。
	•	render() 時のオフスクリーンCanvasの呼び出し。
	•	addEffect(id) / removeEffect(id) / updateEffect(id, newConfig) を実装。
	3.	エフェクトロジック (Background / Text / Waveform / Watermark)
	•	render() 内で Canvas2D API を正しく呼び出す。
	•	isVisible(currentTime) で表示/非表示を制御できる。
	4.	UI / Hooks
	•	EffectList でエフェクト一覧を管理。選択・削除・順序変更が動くか確認。
	•	EffectSettings で選択エフェクトのパラメータを編集→プレビューに即反映。
	•	PlaybackControls で再生・停止・シークができるか、currentTime が正しく動くか。
	5.	エンコード & 出力
	•	VideoEncoderService でフレームループを回し、Canvas→VideoFrame→Encoderへ。
	•	AudioEncoder でAACエンコード（またはOpus）
	•	MP4Muxer で多重化→最終データをBlobダウンロード。
	•	大きいファイルでもエラーなく完走するか検証。
	6.	テスト / デバッグ
	•	小さいファイルで基本動作確認。
	•	長めのファイルでも問題なく再生・エンコードできるか。
	•	各エフェクトの表示タイミングが正しいか。
	•	破損ファイルや想定外の拡張子に対するハンドリング。

7. 今後の拡張
	•	WebGL化
2D Canvas でのボトルネックが顕著になれば、Renderer.ts を差し替えられる設計を想定。
	•	プラグインシステム
features/ フォルダを拡張し、外部から追加エフェクトを注入可能にする仕組みを検討。
	•	CI/CD & 自動テスト
大容量ファイルをテストするパイプラインなどを整備し、パフォーマンスと品質を確保する。

まとめ

本ドキュメントのステップに沿って、まずはオーディオ読み込み→プレビュー再生→エフェクト合成→MP4エクスポートの一連の流れを構築してください。
各モジュールはすでにディレクトリ内にファイルがあるため、具体的な描画ロジック実装・設定UI・WebCodecsまわりの接続を中心に仕上げていけばOKです。

仕様書の大枠を守りつつ、必要最小限な実装から始め、問題があればログやデバッグUIを適宜追加して確認しながら進めてください。

---

以下の一覧は、現状の各実装ファイルを確認したうえで想定される問題点と、その対策案をまとめたものです。実際の動作検証や要件の優先度に応じて、必要な個所から着手してください。

現状の実装の問題点と対策一覧
	1.	EffectManager と AudioPlaybackService の連動不足
	•	問題点: 「再生時刻の更新（AudioPlaybackService や AudioContext）と EffectManager 側の描画タイミング」が明確に同期されていない。
	•	例: 再生した後、描画アップデートが止まる/ズレるケースが起こり得る。
	•	対策:
	1.	AudioPlaybackService の currentTime を定期的に取得し（requestAnimationFrame など）、その値を EffectManager の render() に明示的に渡す。
	2.	もしくは EffectManager が AudioPlaybackService のタイミングイベントを購読し、isPlaying と currentTime を取得して render() する形を検討。
	3.	Hooks の再構成: useAudioControl 内で manager.updateTime(currentTime) を呼んでいる箇所があるが、さらに manager.render() までまとめて呼ぶなど、ロジックを一貫させる。
	2.	複数の Manager インスタンス化や破棄のタイミング
	•	問題点: PreviewCanvas.tsx などで EffectManager が複数回生成・破棄されるタイミングが厳密でない場合、アプリの再マウント時やウィンドウリサイズなどで副作用が発生する可能性がある。
	•	例: リサイズ時に Canvas と Manager の関連付けが壊れる、再生途中で再生成されてしまうなど。
	•	対策:
	1.	EffectManager は App レベルやカスタムフックレベルで一度だけ初期化し、PreviewCanvas には既存のインスタンスを渡すように変更する。
	2.	リサイズは Renderer（内部で保持する OffscreenCanvas を含む）に委譲し、EffectManager 自体は破棄しない設計にすると安定しやすい。
	3.	EffectList.tsx でのエフェクト順序管理（zIndex / moveUp / moveDown）が未実装または不完全
	•	問題点: コード上に manager.moveEffectUp(id) や manager.moveEffectDown(id) といった呼び出しがありますが、EffectManager 側にその具体的な実装が見当たらない可能性がある。
	•	対策:
	1.	EffectManager に moveEffectUp(id) / moveEffectDown(id) を追加し、内部配列の zIndex を再計算 → ソート → render()。
	2.	UI からエフェクトの順序を変更できるようにするので、EffectManager 内では zIndex の重複を防ぎつつ、安定した順序が保たれるように実装。
	4.	エンコード時のフレーム生成ロジックが単純ループになっている
	•	問題点: VideoEncoderService などで「全フレームをループで回してエンコード + 同時に AudioEncoder もエンコードする」流れがあるが、以下の懸念がある:
	•	長時間ファイルの場合、同期的なループでブロッキングが発生し、ブラウザがフリーズするリスク。
	•	大きいオーディオファイルでサンプル数が膨大な場合にパフォーマンスが低下しやすい。
	•	対策:
	1.	非同期的にステップを少しずつ進める: await new Promise(requestAnimationFrame) のように、一定ステップごとにイベントループへ制御を戻す。
	2.	バッチ処理: 1フレームずつではなく、ある程度まとまった単位で VideoEncoderService や AudioEncoder を呼び出していく。
	3.	プログレス表示やキャンセル機能をきちんと実装し、ユーザが途中で中断できるようにする。
	5.	WaveformEffect などがリアルタイム分析 (AnalyserNode) と切り離されている
	•	問題点: WaveformEffect.ts は受け取った waveformData を描画するだけだが、実際には再生中のデータをリアルタイムに取得していないケースがある。
	•	対策:
	1.	AudioPlaybackService に AnalyserNode を実装し、requestAnimationFrame やタイマーなどで波形データを取り込み → EffectManager.updateAudioData() → WaveformEffect に反映するフローを確立。
	2.	波形の種類（line/bar/mirror）を UI から変えやすいように、WaveformEffect 内部の描画処理をさらに分割してもよい。
	6.	mp4-muxer での fastStart: true 時にメモリ消費が大きくなる可能性
	•	問題点: mp4-muxer の fastStart オプションを in-memory などにしている場合、エンコードが終了するまで全データをメモリに保持するため、ファイルが大きいとメモリ使用量が急増する。
	•	対策:
	1.	大きいファイルを想定する場合は、fastStart: 'fragmented' の利用を検討し、フラグメント書き込みにする。
	2.	もしくは Node.js バックエンドと連携し、サーバサイドで最終 mux する構成にする（今回はブラウザ完結が要件かもしれないので要検討）。
	7.	Settings UI が再描画されない／不安定になる可能性
	•	問題点: EffectSettings などのコンポーネントは、選択中エフェクトが更新されても再レンダリングされないケースがあるかもしれない。
	•	例: onEffectChange で manager.updateEffect() → State 更新をしっかり行わないと、React が更新検知できない可能性。
	•	対策:
	1.	App.tsx レベルで useState or Redux/Context などを使い、エフェクトリストや選択IDなどを状態管理し、UI と同期をとる。
	2.	manager 内部の更新通知をフック化 (useEffect + イベントリスナー) し、React にリフレッシュを促す方法もある。
	8.	画像系エフェクト (Background / Watermark) のロードタイミング
	•	問題点: WatermarkEffect や BackgroundEffect が画像URLを設定しても、ロード完了前に描画しようとしてエラーや空描画になるケースがある。
	•	対策:
	1.	HTMLImageElement の onload / onerror を使い、ロード完了後のみ描画フラグを立てる。
	2.	EffectManager に「リソースが未ロードのエフェクトはスキップし、ロード完了後に再描画」する仕組みを入れる。
	3.	大量の画像を使う場合はプレローダーの仕組みを検討する。
	9.	Canvas リサイズと座標系のずれ
	•	問題点: プレビュー領域のリサイズ時に canvas.width と canvas.style.width が混在し、描画スケールが実寸とずれる恐れがある。
	•	対策:
	1.	仕様書にもある通り、内部描画サイズ(論理ピクセル)とCSSでの見た目サイズ(物理ピクセル)を明確に区別する。
	2.	リサイズ処理時、Renderer.setSize() を呼び出して offscreenCanvas も含めて再設定し、エフェクトの座標もリスケールするかどうか検討する。
	10.	冗長なファイル構成・過剰実装のリスク
	•	問題点: features/ フォルダごとに設定UIや Hooks が分かれており、将来的に肥大化しやすい。
	•	対策:
	1.	まずは features/ 単位で分かりやすい実装を続け、必要になれば共通化・抽象化を検討。
	2.	ユースケース別に hooks/ フォルダを整理し、過剰で不要なフックは削除していく。
	3.	「オーバーエンジニアリングを避ける」という方針を常に意識する。

以上の項目について、優先度の高いもの（再生と描画の同期、ファイルサイズの大きい場合の安定性、UI の再レンダリング関連など）から対応を進めてください。たとえば、まずは再生同期機能の安定化 → エンコード時の非同期処理 → UI リフレッシュの確保、といった順序で着手すると、利用者にとって使いやすいアプリケーションとなります。