import React, { useState, useEffect, memo } from 'react';
import { Card, Flex, Heading, Text, Switch } from '@radix-ui/themes';
import { EffectBase } from '../core/types/core';
import { BackgroundEffectConfig, TextEffectConfig, WaveformEffectConfig, WatermarkEffectConfig } from '../core/types/effect';
import { AppError, ErrorType } from '../core/types/error';
import { EffectTimeSettings } from './EffectTimeSettings';
import { BackgroundSettings } from './features/background/BackgroundSettings';
import { WatermarkSettings } from './features/watermark/WatermarkSettings';
import { WaveformSettings } from './features/waveform/WaveformSettings';
import { TextSettings } from './features/text/TextSettings';
import './EffectSettings.css';

type EffectConfig = BackgroundEffectConfig | TextEffectConfig | WaveformEffectConfig | WatermarkEffectConfig;

/**
 * エフェクト設定のプロパティ
 */
interface EffectSettingsProps {
  effect: EffectBase<EffectConfig>;
  onUpdate: (config: Partial<EffectConfig>) => void;
  onError?: (error: AppError) => void;
  duration?: number;
  disabled?: boolean;
}

/**
 * エフェクト設定コンポーネント
 * - エフェクトの時間設定
 * - エフェクト固有の設定
 * - 表示/非表示とレイヤー順序の設定
 */
export const EffectSettings = memo<EffectSettingsProps>(({
  effect,
  onUpdate,
  onError,
  duration,
  disabled = false
}) => {
  const [config, setConfig] = useState<EffectConfig>(effect.getConfig());

  useEffect(() => {
    try {
      const newConfig = effect.getConfig();
      console.log('エフェクト設定更新:', { effectId: effect.getId(), newConfig });
      setConfig(newConfig);
    } catch (error) {
      onError?.(new AppError(
        ErrorType.EffectError,
        'エフェクト設定の取得に失敗しました'
      ));
    }
  }, [effect, onError]);

  const handleTimeChange = (startTime: number, endTime: number) => {
    try {
      const newConfig = {
        startTime,
        endTime,
      };
      onUpdate(newConfig);
      setConfig(prev => ({ ...prev, ...newConfig }));
    } catch (error) {
      onError?.(new AppError(
        ErrorType.EffectError,
        '時間設定の更新に失敗しました'
      ));
    }
  };

  const handleConfigChange = (newConfig: Partial<EffectConfig>) => {
    try {
      onUpdate(newConfig);
      setConfig(prev => ({ ...prev, ...newConfig } as EffectConfig));
    } catch (error) {
      onError?.(new AppError(
        ErrorType.EffectError,
        'エフェクト設定の更新に失敗しました'
      ));
    }
  };

  const renderEffectSpecificSettings = () => {
    try {
      switch (config.type) {
        case 'background':
          return (
            <BackgroundSettings
              config={config}
              onChange={handleConfigChange}
              disabled={disabled}
            />
          );
        case 'text':
          return (
            <TextSettings
              config={config}
              onChange={handleConfigChange}
              disabled={disabled}
            />
          );
        case 'waveform':
          return (
            <WaveformSettings
              config={config}
              onChange={handleConfigChange}
              disabled={disabled}
            />
          );
        case 'watermark':
          return (
            <WatermarkSettings
              config={config}
              onChange={handleConfigChange}
              disabled={disabled}
            />
          );
        default:
          onError?.(new AppError(
            ErrorType.EffectError,
            `未対応のエフェクトタイプです`
          ));
          return null;
      }
    } catch (error) {
      onError?.(new AppError(
        ErrorType.EffectError,
        'エフェクト固有の設定の描画に失敗しました'
      ));
      return null;
    }
  };

  return (
    <div className="effect-settings">
      <div className="effect-settings-content">
        {/* 時間設定 */}
        <Card size="1">
          <Flex direction="column" gap="1">
            <Heading as="h4" size="2">表示時間</Heading>
            <EffectTimeSettings
              startTime={config.startTime ?? 0}
              endTime={config.endTime ?? duration}
              duration={duration ?? 0}
              onTimeChange={handleTimeChange}
              disabled={disabled}
            />
          </Flex>
        </Card>

        {/* エフェクト固有の設定 */}
        <Card size="1">
          <Flex direction="column" gap="1">
            <div className="effect-specific-settings">
              {renderEffectSpecificSettings()}
            </div>
          </Flex>
        </Card>

        {/* 表示/非表示切り替えとzIndex設定 */}
        <Card size="1">
          <Flex direction="column" gap="2">
            <Flex align="center" justify="between" gap="2">
              <Text as="label" size="1">表示</Text>
              <Switch
                checked={config.visible}
                onCheckedChange={(checked) => handleConfigChange({ visible: checked })}
                disabled={disabled}
              />
            </Flex>
            <Flex direction="column" gap="1">
              <Text as="label" size="1" htmlFor="zIndex">レイヤー順序</Text>
              <input
                id="zIndex"
                type="number"
                value={config.zIndex}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleConfigChange({ zIndex: parseInt(e.target.value, 10) })
                }
                min={0}
                className="rt-TextFieldInput rt-r-size-1"
                disabled={disabled}
              />
            </Flex>
          </Flex>
        </Card>
      </div>
    </div>
  );
});

EffectSettings.displayName = 'EffectSettings';
