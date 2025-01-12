prompt.md

# 修正のための作業指示書

以下は、本プロジェクト実装において **想定動作と実際のコードに乖離** が見られる点、  
および **運用上の問題** を洗い出し、その**修正指示**をまとめたものです。

---

## 1. `mp4-muxer` 呼び出しパラメータの不整合

**問題**  
- `addVideoChunk(chunk, undefined, timestamp)` のように、timestamp と duration の順序を誤って渡している。  

**対応指示**  
1. **型定義**（`mp4-muxer.d.ts`）を再確認し、**第2引数に timestamp**、**第3引数に duration?** を渡す形式に合わせる。  
2. たとえば、duration が不要なら `addVideoChunk(chunk, timestamp)` のみとする。  
3. 音声でも同様に修正。

---

## 2. `finalize()` 非同期完了待ちが不足

**問題**  
- `MP4Muxer.finish()` で `finalize()` を呼ぶ際に `await` / `.then()` しておらず、実際には MP4 が完成していない状態で `onData()` を呼んでいる。

**対応指示**  
1. `async finish(): Promise<void>` に変更し、`const mp4 = await this.muxer.finalize();` として完了を待つ。  
2. 完了後に `onData(mp4)`、最後に `onFinish()` を呼ぶ。

---

## 3. Canvas座標系の`setTransform` で `restore()` が無い

**問題**  
- `TextEffect` 等で `ctx.setTransform()` 後、`ctx.save()` / `ctx.restore()` を行わず、他エフェクトや次フレームで座標がずれる。

**対応指示**  
1. `render()` 内で `ctx.save()` し、必要な変形後に `ctx.restore()` を行う。  
2. もしくは `applyAnimation()` の前後で `save()` / `restore()` を徹底する。

---

## 4. UI 状態管理とエフェクト設定の乖離

**問題**  
- UI で画像URLやカラーなどを更新しても、`effect.updateConfig()` を呼ばないと描画に反映されない。  
- 特に背景画像・ウォーターマーク画像で、ロード完了前に `render()` が走りエラーや無表示になるケースがある。

**対応指示**  
1. 各設定UI (`XxxSettings.tsx`) で値変更時、**必ず `updateConfig()`** を呼ぶ。  
2. 画像URLなど非同期要素は、**ロード完了時に `imageLoaded` フラグを立てる** or `this.image.complete` を確認してから描画。  
3. ロード失敗 (`onerror`) の場合に備えたエラーハンドリングを追加。

---

## 5. ウォーターマーク追加時に落ちる不具合

**問題**  
- `WatermarkEffect` で `this.image` が存在しない/ロードされないまま `render()` しようとして例外が起きる場合がある。

**対応指示**  
1. コンストラクタ/`updateConfig()` で `imageUrl` が無い場合は描画をスキップする。  
2. `this.image.onload` / `this.image.onerror` などを使い、ロードフラグ (`this.imageLoaded`) を管理。  
3. `render()` で `if (!this.imageLoaded) return;` など安全策を取る。

---

## 6. フレームごとの `createImageBitmap` と `setTimeout` のパフォーマンス

**問題**  
- `useVideoEncoder` でフレーム毎に `createImageBitmap(canvas)`→ `encodeVideoFrame()`→ `await new Promise(...)` を行い、  
  パフォーマンスやリアルタイム性に影響が出る可能性が高い。

**対応指示**  
1. 必要があれば、**オフライン処理**として高速にフレームを生成 & エンコードし、完了後に一括でMP4Muxerに渡す方式を検討。  
2. リアルタイムをシミュレートするなら `requestAnimationFrame` と組み合わせるなど方法を見直す。  
3. `OffscreenCanvas.transferToImageBitmap()` が使えるならそちらを利用し、`createImageBitmap` のコストを抑える。

---

## 7. `startTime` / `endTime` が `undefined` のとき常時表示になる仕様

**問題**  
- `EffectBase.isVisible()` 内で  
  ```ts
  if (startTime === undefined || endTime === undefined) {
    return true;
  }

としており、一部ユーザが意図せず「常に表示」状態になる可能性がある。

対応指示
	1.	仕様通り「未指定の場合は常に可視」でよいのか、UI で必須入力にするのか検討する。
	2.	必須にする場合はUIでバリデーションを行い、undefined を許可しない。

8. ウォーターマークタイル描画の負荷

問題
	•	高解像度キャンバスで繰り返し描画すると、for ループで drawImage を大量に行いパフォーマンスが低下する。

対応指示
	1.	ctx.createPattern(image, 'repeat') で一括塗りつぶしする方法を検討。
	2.	タイル数が多くならないよう、UI で制限するなども併せて検討。

9. 背景画像設定における描画漏れ

問題
	•	BackgroundEffect で imageUrl をセットしても、ロード完了前に render() が走ると真っ黒（または前の状態）のままになる。

対応指示
	1.	this.image?.complete が true かどうか確認。
	2.	onload と onerror をハンドリングし、画像ロードフラグを管理する。
	3.	UI から新しい URL を受け取ったら、旧画像の表示と混在しないよう注意する。

10. 作業ステップ概略
	1.	MP4Muxer
	•	引数不整合の修正 (addVideoChunk, addAudioChunk)
	•	finalize() の非同期完了待ち実装
	2.	Canvas座標系 & 各Effect
	•	setTransform 使用時の save() / restore()
	3.	UI 状態管理
	•	XxxSettings.tsx 内で更新があったら即 updateConfig()
	•	画像などのロード完了フラグを render() 前に確認
	4.	WatermarkEffect & BackgroundEffect
	•	ロードエラー時や画像未指定時の安全策
	5.	VideoEncoder
	•	フレーム取り込み手段・ループ方式の見直し（必要あれば）
	6.	時間指定 (start/end)
	•	undefined の扱いをUIで明示
	7.	ウォーターマークタイル描画
	•	パターン利用や描画回数抑制の最適化

以上の指示に従い、本プロジェクトの実装を修正・改善 してください。

