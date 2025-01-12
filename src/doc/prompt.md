# 移行ガイド (prompt.md)

以下は、既存のディレクトリやファイルを [`spec.md`](./src/doc/spec.md) の設計に準拠させるためのステップ・指示書です。

---

## 1. 目的

- 既存の複雑な構造を、「コア基盤 (core/)」と「機能別フォルダ (features/)」＋「UI (ui/)」のシンプルな構成に再編する
- エフェクト関連のファイルをまとめ、不要な抽象レイヤーや過度なNode細分化を削減
- 仕様書（spec.md）の「ディレクトリ構成」に最大限合わせる

---

## 2. 大まかな作業ステップ

### 2.1 コアロジックを `core/` フォルダに集約

1. **`src/services/effects/base/Effect.ts` → `src/core/EffectBase.ts` へ移動・リネーム**  
   - クラス名を `EffectBase` とする  
   - 共通のエフェクト設定インターフェースなども `core/types.ts` に統合

2. **`src/services/effects/manager/EffectManager.ts` → `src/core/EffectManager.ts`**  
   - 複数エフェクトを管理し、一括レンダリングする機能を持たせる  

3. **`src/services/effects/renderer/CanvasRenderer.ts` → `src/core/Renderer.ts`**  
   - 2D Canvas での描画を行うクラスとして移管  
   - 将来的にWebGLなど別Renderer実装を検討する場合は差し替え可能に

4. **`src/services/encoder/AudioEncoderService.ts` と `src/services/encoder/VideoEncoderService.ts` → 統合し `src/core/EncoderService.ts`**  
   - 音声/映像エンコードをまとめて扱う（内部的にクラス分割してもOK）

5. **`src/services/video/MP4Multiplexer.ts` → `src/core/MP4Muxer.ts`**  
   - mp4多重化のロジックを１ファイルにまとめる  

> **備考**: その他 `Node.ts` や `types.ts` が散在している場合も、必要最低限は `core/` に移動し、重複や過度な抽象は削減。

---

### 2.2 エフェクト毎に `features/` フォルダを作成

1. **Backgroundエフェクト**  
   - `src/services/effects/effects/background/BackgroundEffect.ts` → `src/features/background/BackgroundEffect.ts`  
   - UI系ファイル (`BackgroundSettings.tsx`, `BackgroundPreview.tsx`) も `src/components/effects/background/` 等にあるなら **同じく** `src/features/background/` に移動  
   - 可能ならファイル名を短く整理: `BackgroundSettings.tsx`, `BackgroundPreview.tsx`  
   - まとめて `index.ts` で export

2. **Textエフェクト**  
   - 同様に `TextEffect.ts`, `TextSettings.tsx`, `TextPreview.tsx` を `src/features/text/` に移動

3. **Waveformエフェクト**  
   - `WaveformEffect.ts`, `WaveformSettings.tsx`, `WaveformPreview.tsx` → `src/features/waveform/`

4. **Watermarkエフェクト**  
   - `WatermarkEffect.ts`, `WatermarkSettings.tsx`, `WatermarkPreview.tsx` → `src/features/watermark/`

> **ポイント**: 各エフェクトのロジック(`XxxEffect.ts`)と UI(`XxxSettings.tsx`, `XxxPreview.tsx`)を**1フォルダ**にまとめることでわかりやすさ向上。

---

### 2.3 UI 全体を `ui/` フォルダにまとめる

1. **プレビュー関連**  
   - `src/components/preview/PreviewCanvas.tsx` → `src/ui/PreviewCanvas.tsx`  
   - `BoundingBox.tsx` や `PreviewPlayer.tsx` があるなら `src/ui/common/` or `src/ui/` に移動

2. **インスペクタ関連**  
   - `src/components/inspector/Inspector.tsx` → `src/ui/Inspector.tsx`  
   - EffectInspector など個別ファイルがあれば `ui/common/` または同フォルダにまとめる

3. **EncoderSettingsなど**  
   - エンコード設定UIがある場合は `src/ui/EncoderSettings.tsx` にまとめる

---

### 2.4 不要なノードや抽象化を整理

- **`services/effects/nodes/`** のように極端に細分化された Node が多数ある場合  
  - まずは各 `XxxEffect.ts` の `render()` に直接Canvas操作ロジックを書き、一旦統合  
  - 共通処理（Blend, Transform など）は `src/utils/transformUtils.ts` などに関数でまとめる程度に留める  
  - 本当に必要になった時にのみ Node クラスを再導入する

---

### 2.5 インポートパス＆型を修正

1. **インポート先変更**  
   - 例: `import { Effect } from '../../services/effects/base/Effect'`  
     → `import { EffectBase } from '../../core/EffectBase'`
2. **型の重複削減**  
   - `BaseEffectConfig` と `WaveformEffectConfig` などの継承関係を簡潔化  
   - なるべく `core/types.ts` に集約し、features 側では拡張型だけ定義する
3. **ビルド確認**  
   - `npm run build` or `yarn build` でエラーが出た場合、不要ファイル削除＆パス修正

---

### 2.6 動作確認

1. **ローカル起動**  
   - `npm run dev` or `yarn dev`  
   - コンソールエラーやバンドルエラーがないか確認
2. **プレビュー確認**  
   - 各エフェクト（背景・テキスト・波形・ウォーターマーク）が正しく描画されるか  
3. **エンコード & MP4 ダウンロード**  
   - `EncoderService` + `MP4Muxer` が正常に動作しているかテスト  
   - 大きめのファイルでもエラーなく完了するか

---

## 3. 移行後のメリット

1. **ディレクトリの見通しが良くなり、エフェクト追加・削除が容易**  
   - 新しくエフェクトを作る際は `features/myNewEffect/` を用意するだけ  
2. **抽象レイヤーが最小限に整備され、学習コストが低い**  
   - `EffectBase` & `EffectManager` & `Renderer` が分かれば基本がわかる  
3. **UIパーツが一貫して `ui/` に集まるため、再利用しやすい**  
   - 共通部品は `ui/common/`、エフェクト固有の設定は `features/xxx/`  
4. **エンコードや多重化の流れがシンプル**  
   - `EncoderService` + `MP4Muxer` に集約されるため把握しやすい

---

## 4. 最終チェックリスト

- [ ] `core/` フォルダに EffectBase, EffectManager, Renderer, EncoderService, MP4Muxer が収まっている  
- [ ] `features/` フォルダに 各エフェクト(ロジック & UI) が整理されている  
- [ ] `ui/` フォルダに アプリ全体のプレビューやインスペクタが集約  
- [ ] utils/ や common フォルダを適切に使い、重複コードを減らしている  
- [ ] 実行時エラーが発生せず、ビルド・プレビュー・エンコードが問題なく行える

移行完了後は、`spec.md` と本ドキュメント(`prompt.md`)をプロジェクト内に配置しておき、**新規追加・改修時も同じ方針で実装**していくことで、コードベースの整合性が保たれます。