export * from './audio';
export * from './effects';

// 共通の型定義
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Dimensions = {
  width: number;
  height: number;
};

export type Position = {
  x: number;
  y: number;
}; 