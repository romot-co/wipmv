import { BaseEffectConfig, AudioVisualParameters } from './types';

export interface BaseEffectState {
  isVisible: boolean;
  isPlaying: boolean;
  startTime: number;
  endTime: number;
}

export abstract class EffectBase {
  private config: BaseEffectConfig;
  private state: BaseEffectState;

  constructor(config: BaseEffectConfig) {
    this.config = {
      ...config,
      startTime: config.startTime ?? 0,
      endTime: config.endTime ?? Infinity,
      zIndex: config.zIndex ?? 0
    };
    this.state = {
      isVisible: true,
      isPlaying: false,
      startTime: this.config.startTime,
      endTime: this.config.endTime
    };
  }

  public getConfig<T extends BaseEffectConfig = BaseEffectConfig>(): T {
    return this.config as T;
  }

  public getState(): BaseEffectState {
    return this.state;
  }

  protected setState(newState: Partial<BaseEffectState>): void {
    this.state = { ...this.state, ...newState };
  }

  public isVisible(currentTime: number): boolean {
    return (
      this.state.isVisible &&
      currentTime >= this.state.startTime &&
      currentTime <= this.state.endTime
    );
  }

  public setStartTime(time: number): void {
    if (isNaN(time) || time < 0) {
      time = 0;
    }
    if (time > this.state.endTime) {
      throw new Error('Start time cannot be greater than end time');
    }
    this.setState({ startTime: time });
    this.config.startTime = time;
  }

  public setEndTime(time: number): void {
    if (isNaN(time)) {
      time = Infinity;
    }
    if (time < this.state.startTime) {
      throw new Error('End time cannot be less than start time');
    }
    this.setState({ endTime: time });
    this.config.endTime = time;
  }

  public setTimeRange(startTime: number, endTime: number): void {
    if (isNaN(startTime) || startTime < 0) {
      startTime = 0;
    }
    if (isNaN(endTime)) {
      endTime = Infinity;
    }
    if (startTime > endTime) {
      throw new Error('Start time cannot be greater than end time');
    }
    this.setState({ startTime, endTime });
    this.config.startTime = startTime;
    this.config.endTime = endTime;
  }

  public getStartTime(): number {
    return this.state.startTime;
  }

  public getEndTime(): number {
    return this.state.endTime;
  }

  public getZIndex(): number {
    return this.config.zIndex;
  }

  public updateConfig(newConfig: Partial<BaseEffectConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig
    };

    // 時間設定が更新された場合は状態も更新
    if ('startTime' in newConfig || 'endTime' in newConfig) {
      this.setTimeRange(
        newConfig.startTime ?? this.state.startTime,
        newConfig.endTime ?? this.state.endTime
      );
    }
  }

  public abstract render(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    params: AudioVisualParameters
  ): void;

  public dispose(): void {
    // サブクラスでオーバーライド可能
  }
} 