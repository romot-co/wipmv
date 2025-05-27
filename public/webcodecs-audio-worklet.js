// src/audio-worklet-processor.ts
var EncoderAudioWorkletProcessor = class extends AudioWorkletProcessor {
  constructor() {
    super();
    this.workerPort = null;
    this.sampleRateVal = sampleRate;
    this.processedFrames = 0;
    this.port.onmessage = (event) => {
      if (event.data?.port) {
        this.workerPort = event.data.port;
      }
      if (event.data?.sampleRate) {
        this.sampleRateVal = event.data.sampleRate;
      }
    };
  }
  process(inputs) {
    if (!this.workerPort) return true;
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const firstChannel = input[0];
    if (!firstChannel || firstChannel.length === 0) return true;
    const numChannels = input.length;
    const numFrames = firstChannel.length;
    const buffers = [];
    for (let c = 0; c < numChannels; c++) {
      const copy = new Float32Array(input[c]);
      buffers.push(copy);
    }
    const timestamp = this.processedFrames / this.sampleRateVal * 1e6;
    this.processedFrames += numFrames;
    this.workerPort.postMessage(
      {
        type: "addAudioData",
        audioData: buffers,
        numberOfFrames: numFrames,
        numberOfChannels: numChannels,
        sampleRate: this.sampleRateVal,
        timestamp,
        format: "f32-planar"
      },
      buffers.map((b) => b.buffer)
    );
    return true;
  }
};
registerProcessor("encoder-audio-worklet", EncoderAudioWorkletProcessor);
//# sourceMappingURL=audio-worklet-processor.js.map