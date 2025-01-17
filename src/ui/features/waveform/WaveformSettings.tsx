import React from 'react';
import { WaveformEffectConfig } from '../../../core/types';
import { Flex, Box, Text, Select, Slider } from '@radix-ui/themes';
import '../../EffectSettings.css';

interface WaveformSettingsProps {
  config: WaveformEffectConfig;
  onChange: (newConfig: Partial<WaveformEffectConfig>) => void;
}

export const WaveformSettings: React.FC<WaveformSettingsProps> = ({
  config,
  onChange
}) => {
  return (
    <div className="effect-settings">
      <Flex direction="column" gap="3">
        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            波形種別
          </Text>
          <Select.Root
            value={config.waveformType}
            onValueChange={(value) => onChange({ waveformType: value as WaveformEffectConfig['waveformType'] })}
          >
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="bar">バー</Select.Item>
              <Select.Item value="line">ライン</Select.Item>
              <Select.Item value="circle">サークル</Select.Item>
            </Select.Content>
          </Select.Root>
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            バーの幅
          </Text>
          <Flex gap="3" align="center">
            <Slider
              value={[config.barWidth]}
              min={1}
              max={50}
              step={1}
              onValueChange={(value) => onChange({ barWidth: value[0] })}
            />
            <Text size="2">{config.barWidth}px</Text>
          </Flex>
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            バーの間隔
          </Text>
          <Flex gap="3" align="center">
            <Slider
              value={[config.barGap]}
              min={0}
              max={20}
              step={1}
              onValueChange={(value) => onChange({ barGap: value[0] })}
            />
            <Text size="2">{config.barGap}px</Text>
          </Flex>
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            感度
          </Text>
          <Flex gap="3" align="center">
            <Slider
              value={[config.sensitivity]}
              min={0.1}
              max={5}
              step={0.1}
              onValueChange={(value) => onChange({ sensitivity: value[0] })}
            />
            <Text size="2">{config.sensitivity}</Text>
          </Flex>
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            波形の色
          </Text>
          <Flex gap="3" align="center">
            <input
              type="color"
              value={config.color}
              onChange={(e) => onChange({ color: e.target.value })}
              className="color-picker"
            />
            <input
              type="text"
              value={config.color}
              onChange={(e) => onChange({ color: e.target.value })}
              pattern="^#[0-9A-Fa-f]{6}$"
              className="color-input"
            />
          </Flex>
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            不透明度
          </Text>
          <Flex gap="3" align="center">
            <Slider
              value={[config.opacity ?? 1]}
              min={0}
              max={1}
              step={0.1}
              onValueChange={(value) => onChange({ opacity: value[0] })}
            />
            <Text size="2">{config.opacity ?? 1}</Text>
          </Flex>
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            ブレンドモード
          </Text>
          <Select.Root
            value={config.blendMode ?? 'source-over'}
            onValueChange={(value) => onChange({ blendMode: value as GlobalCompositeOperation })}
          >
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="source-over">通常</Select.Item>
              <Select.Item value="multiply">乗算</Select.Item>
              <Select.Item value="screen">スクリーン</Select.Item>
              <Select.Item value="overlay">オーバーレイ</Select.Item>
              <Select.Item value="darken">暗く</Select.Item>
              <Select.Item value="lighten">明るく</Select.Item>
            </Select.Content>
          </Select.Root>
        </Box>
      </Flex>
    </div>
  );
}; 