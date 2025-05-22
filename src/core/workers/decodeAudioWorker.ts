import debug from 'debug';

const log = debug('app:decodeAudioWorker');

/**
 * オーディオデコード処理を行う Web Worker
 */

self.onmessage = async (event: MessageEvent<ArrayBuffer>) => {
  const arrayBuffer = event.data;

  try {
    log('[Worker] Audio decode request received');
    // OfflineAudioContext を使ってデコードを試みる
    // AudioBuffer は transferable ではないため、OfflineAudioContext が使えるか確認
    // (仕様上は Worker 内で OfflineAudioContext は利用可能)
    
    // 仮のチャンネル数とサンプルレート (デコード後にわかるので、ここでは適当な値)
    // decodeAudioData が成功すれば、実際のチャンネル数とサンプルレートが得られる
    // が、OfflineAudioContext のコンストラクタには必要...
    // -> decodeAudioData は AudioContext/OfflineAudioContext のメソッドなので、
    //    Worker 内で OfflineAudioContext を作成しても意味がない可能性が高い。
    
    // 【再考】AudioContext/OfflineAudioContext はメインスレッドで作成し、
    // decodeAudioData を呼び出すのが標準的な使い方。
    // メインスレッドのブロックを避けるには、decodeAudioData 自体が
    // 内部的に別スレッドで処理されることを期待するか、
    // ライブラリ (例: ffmpeg.wasm) を Worker で使うなどのアプローチが必要。

    // ここでは、Web Audio API の標準的な使い方に留め、
    // decodeAudioData がメインスレッドをブロックする可能性は許容する方針とする。
    // (もし将来的にパフォーマンス問題が顕著になった場合にライブラリ導入を検討)

    // そのため、この Worker は現状不要。
    // 代わりに AudioAnalyzerService の処理 (FFTなど) を Worker 化することを検討する。

    console.warn('[Worker] decodeAudioData cannot be effectively offloaded using standard OfflineAudioContext in a worker.');
    // エラーとしてメインスレッドに通知 (または null を返すなど)
    self.postMessage({ success: false, error: 'decodeAudioData cannot be run in this worker' });

    /* --- OfflineAudioContext を使う場合の想定コード (動作しない可能性大) ---
    try {
      // decodeAudioData は context のメソッドなので、context が必要
      // しかし Worker 内で AudioContext は作れない。OfflineAudioContext は作れるが...
      const tempContext = new OfflineAudioContext(1, 1, 44100); // dummy values
      const audioBuffer = await tempContext.decodeAudioData(arrayBuffer);
      log('[Worker] Audio decode successful');
      // AudioBuffer は転送できないので、Float32Array に変換して送る？
      const channels = [];
      for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        channels.push(audioBuffer.getChannelData(i));
      }
      // Transferable オブジェクトとして Float32Array の buffer を送る
      self.postMessage({ 
        success: true, 
        channels,
        sampleRate: audioBuffer.sampleRate,
        duration: audioBuffer.duration
      }, channels.map(c => c.buffer));

    } catch (error) {
      console.error('[Worker] Audio decode failed:', error);
      self.postMessage({ success: false, error: error.message });
    }
    */

  } catch (error) {
    console.error('[Worker] Unexpected error:', error);
    self.postMessage({ success: false, error: 'Unexpected worker error' });
  }
};
