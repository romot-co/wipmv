declare module 'mp4-muxer' {
  export interface MuxerOptions {
    target?: ArrayBufferTarget | StreamTarget;
    fastStart?: boolean;
    width?: number;
    height?: number;
    timescale?: number;
    firstTimestampBehavior?: 'strict' | 'offset';
  }

  export interface VideoTrackOptions {
    width: number;
    height: number;
    codec: string;
  }

  export interface AudioTrackOptions {
    codec: string;
    sampleRate?: number;
    numberOfChannels?: number;
  }

  export class ArrayBufferTarget {
    buffer: Uint8Array;
    constructor();
  }

  export class StreamTarget {
    constructor(writableStream: WritableStream);
  }

  export class Muxer {
    constructor(options: MuxerOptions);
    addVideoChunk(chunk: EncodedVideoChunk, timestamp: number, duration?: number): void;
    addAudioChunk(chunk: EncodedAudioChunk, timestamp: number, duration?: number): void;
    addVideoTrack(options: VideoTrackOptions): void;
    addAudioTrack(options: AudioTrackOptions): void;
    finalize(): Promise<Uint8Array>;
  }
} 