import React, { useState, useEffect } from 'react';
import { EffectBase } from '../core/EffectBase';
import { 
  EffectType,
  EffectConfig,
} from '../core/types';
import { EffectTimeSettings } from './EffectTimeSettings';
import { Card, Flex, Heading, Text, Switch } from '@radix-ui/themes';
import { BackgroundSettings } from './features/background/BackgroundSettings';
import { WatermarkSettings } from './features/watermark/WatermarkSettings';
import { WaveformSettings } from './features/waveform/WaveformSettings';
import { TextSettings } from './features/text/TextSettings';
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
    const newConfig = effect.getConfig();
    console.log('エフェクト設定更新:', { effectId: effect.getId(), newConfig });
    setConfig(newConfig);
  }, [effect, effect.getConfig]);

  const handleTimeChange = (startTime: number, endTime: number) => {
    const newConfig = {
      startTime,
      endTime,
    };
    onUpdate(newConfig);
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const handleConfigChange = (newConfig: Partial<EffectConfig>) => {
    onUpdate(newConfig);
    setConfig(prev => ({ ...prev, ...newConfig } as EffectConfig));
  };

  const renderEffectSpecificSettings = () => {
    switch (config.type) {
      case EffectType.Background:
        return (
          <BackgroundSettings
            config={config}
            onChange={handleConfigChange}
          />
        );

      case EffectType.Watermark:
        return (
          <WatermarkSettings
            config={config}
            onChange={handleConfigChange}
          />
        );

      case EffectType.Waveform:
        return (
          <WaveformSettings
            config={config}
            onChange={handleConfigChange}
          />
        );

      case EffectType.Text:
        return (
          <TextSettings
            config={config}
            onChange={handleConfigChange}
          />
        );

      default:
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
              duration={duration}
              onTimeChange={handleTimeChange}
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
              />
            </Flex>
          </Flex>
        </Card>
      </div>
    </div>
  );
}; 