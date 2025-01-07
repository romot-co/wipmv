import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { VideoConfig, AudioConfig } from '../../types';

export class MP4Multiplexer {
  private muxer: Muxer<ArrayBufferTarget>;

  constructor(videoConfig: VideoConfig, audioConfig: AudioConfig) {
    this.muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: {
        codec: 'avc',
        width: videoConfig.width,
        height: videoConfig.height,
      },
      audio: {
        codec: 'aac',
        sampleRate: audioConfig.sampleRate,
        numberOfChannels: audioConfig.numberOfChannels,
      },
      fastStart: 'in-memory',
    });
  }

  addVideoChunk(chunk: EncodedVideoChunk, meta: EncodedVideoChunkMetadata): void {
    this.muxer.addVideoChunk(chunk, meta);
  }

  addAudioChunk(chunk: EncodedAudioChunk, meta: EncodedAudioChunkMetadata): void {
    this.muxer.addAudioChunk(chunk, meta);
  }

  finalize(): Uint8Array {
    this.muxer.finalize();
    return new Uint8Array((this.muxer.target as ArrayBufferTarget).buffer);
  }
}