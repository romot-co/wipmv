declare module 'fft.js' {
  export default class FFT {
    constructor(size: number);
    createComplexArray(): Float32Array;
    realTransform(output: Float32Array, input: Float32Array): void;
    completeSpectrum(output: Float32Array): void;
  }
} 