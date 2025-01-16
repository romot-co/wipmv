import React, { useState, useEffect } from 'react';
import { EffectBase } from '../core/EffectBase';
import { 
  BaseEffectConfig, 
  EffectType,
  BackgroundEffectConfig,
  TextEffectConfig,
  WaveformEffectConfig,
  WatermarkEffectConfig,
  EffectConfig
} from '../core/types';
import { EffectTimeSettings } from './EffectTimeSettings';
import { BackgroundSettings } from './features/background/BackgroundSettings';
import { TextSettings } from './features/text/TextSettings';
import { WaveformSettings } from './features/waveform/WaveformSettings';
import { WatermarkSettings } from './features/watermark/WatermarkSettings';
import { Card, Flex, Text, Heading, Switch } from '@radix-ui/themes';
import './EffectSettings.css';

interface EffectSettingsProps {
  effect: EffectBase<EffectConfig>;
  onUpdate: (config: Partial<EffectConfig>) => void;
  duration: number;
}

export const EffectSettings: React.FC<EffectSettingsProps> = ({
  effect,
  onUpdate,
  duration,
}) => {
  const [config, setConfig] = useState<EffectConfig>(effect.getConfig());

  useEffect(() => {
    setConfig(effect.getConfig());
  }, [effect]);

  const handleTimeChange = (startTime: number, endTime: number) => {
    const newConfig = {
      startTime,
      endTime,
    };
    onUpdate(newConfig);
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const handleConfigChange = (newConfig: Partial<BaseEffectConfig>) => {
    onUpdate(newConfig);
    setConfig(prev => ({ ...prev, ...newConfig } as EffectConfig));
  };

  const renderEffectSpecificSettings = () => {
    switch (config.type) {
      case EffectType.Background:
        return (
          <BackgroundSettings
            config={config as BackgroundEffectConfig}
            onChange={handleConfigChange}
          />
        );
      case EffectType.Text:
        return (
          <TextSettings
            config={config as TextEffectConfig}
            onChange={handleConfigChange}
          />
        );
      case EffectType.Waveform:
        return (
          <WaveformSettings
            config={config as WaveformEffectConfig}
            onChange={handleConfigChange}
          />
        );
      case EffectType.Watermark:
        return (
          <WatermarkSettings
            config={config as WatermarkEffectConfig}
            onChange={handleConfigChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="effect-settings">
      <Flex direction="column" gap="4">
        <Heading as="h3" size="4">エフェクト設定</Heading>

        {/* 時間設定 */}
        <Card>
          <Flex direction="column" gap="2">
            <Heading as="h4" size="3">表示時間</Heading>
            <EffectTimeSettings
              startTime={config.startTime ?? 0}
              endTime={config.endTime ?? duration}
              duration={duration}
              onTimeChange={handleTimeChange}
            />
          </Flex>
        </Card>

        {/* エフェクト固有の設定 */}
        <Card>
          <Flex direction="column" gap="2">
            <Heading as="h4" size="3">エフェクト設定</Heading>
            <div className="effect-specific-settings">
              {renderEffectSpecificSettings()}
            </div>
          </Flex>
        </Card>

        {/* 表示/非表示切り替え */}
        <Card>
          <Flex align="center" justify="between" gap="2">
            <Text as="label" size="2">表示</Text>
            <Switch
              checked={config.visible}
              onCheckedChange={(checked) => handleConfigChange({ visible: checked })}
            />
          </Flex>
        </Card>

        {/* zIndex設定 */}
        <Card>
          <Flex direction="column" gap="2">
            <Text as="label" size="2" htmlFor="zIndex">レイヤー順序</Text>
            <input
              id="zIndex"
              type="number"
              value={config.zIndex}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleConfigChange({ zIndex: parseInt(e.target.value, 10) })
              }
              min={0}
              className="rt-TextFieldInput"
            />
          </Flex>
        </Card>
      </Flex>
    </div>
  );
}; 