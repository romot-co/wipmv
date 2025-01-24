import React, { memo } from 'react';
import { BlendMode } from '../../../core/types/base';
import { TextEffectConfig } from '../../../core/types/effect';
import { Flex, Box, Text, Select, Slider, TextArea } from '@radix-ui/themes';
import { ColorInput } from '../../common/ColorInput';
import '../../EffectSettings.css';

interface TextSettingsProps {
  config: TextEffectConfig;
  onChange: (newConfig: Partial<TextEffectConfig>) => void;
  disabled?: boolean;
}

export const TextSettings = memo<TextSettingsProps>(({
  config,
  onChange,
  disabled
}) => {
  return (
    <div className="effect-settings">
      <Flex direction="column" gap="3">
        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            テキスト
          </Text>
          <TextArea
            value={config.text}
            onChange={(e) => onChange({ text: e.target.value })}
            rows={3}
            disabled={disabled}
          />
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            フォント
          </Text>
          <Select.Root
            value={config.font.family}
            onValueChange={(value) => onChange({
              font: {
                ...config.font,
                family: value
              }
            })}
            disabled={disabled}
          >
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="Arial">Arial</Select.Item>
              <Select.Item value="Helvetica">Helvetica</Select.Item>
              <Select.Item value="Times New Roman">Times New Roman</Select.Item>
              <Select.Item value="Courier New">Courier New</Select.Item>
              <Select.Item value="Georgia">Georgia</Select.Item>
              <Select.Item value="Meiryo">メイリオ</Select.Item>
              <Select.Item value="MS Gothic">ＭＳ ゴシック</Select.Item>
              <Select.Item value="MS Mincho">ＭＳ 明朝</Select.Item>
              <Select.Item value="Yu Gothic">游ゴシック</Select.Item>
              <Select.Item value="Yu Mincho">游明朝</Select.Item>
            </Select.Content>
          </Select.Root>
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            フォントサイズ
          </Text>
          <Flex gap="3" align="center">
            <Slider
              value={[config.font.size]}
              min={8}
              max={72}
              step={1}
              onValueChange={(value) => onChange({
                font: {
                  ...config.font,
                  size: value[0]
                }
              })}
              disabled={disabled}
            />
            <Text size="2">{config.font.size}px</Text>
          </Flex>
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            フォントの太さ
          </Text>
          <Select.Root
            value={config.font.weight?.toString() ?? 'normal'}
            onValueChange={(value) => onChange({
              font: {
                ...config.font,
                weight: value
              }
            })}
            disabled={disabled}
          >
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="normal">通常</Select.Item>
              <Select.Item value="bold">太字</Select.Item>
              <Select.Item value="100">Thin (100)</Select.Item>
              <Select.Item value="300">Light (300)</Select.Item>
              <Select.Item value="400">Regular (400)</Select.Item>
              <Select.Item value="500">Medium (500)</Select.Item>
              <Select.Item value="700">Bold (700)</Select.Item>
              <Select.Item value="900">Black (900)</Select.Item>
            </Select.Content>
          </Select.Root>
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            テキストカラー
          </Text>
          <ColorInput
            value={config.color}
            onChange={(value) => onChange({ color: value })}
            disabled={disabled}
          />
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            テキストの位置
          </Text>
          <Flex direction="column" gap="2">
            <Flex gap="3" align="center">
              <Text size="2" weight="medium">X座標</Text>
              <input
                type="number"
                value={config.position.x}
                onChange={(e) => onChange({
                  position: {
                    x: Number(e.target.value),
                    y: config.position.y
                  }
                })}
                className="number-input"
                disabled={disabled}
              />
            </Flex>
            <Flex gap="3" align="center">
              <Text size="2" weight="medium">Y座標</Text>
              <input
                type="number"
                value={config.position.y}
                onChange={(e) => onChange({
                  position: {
                    x: config.position.x,
                    y: Number(e.target.value)
                  }
                })}
                className="number-input"
                disabled={disabled}
              />
            </Flex>
          </Flex>
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            テキストの配置
          </Text>
          <Select.Root
            value={config.alignment ?? 'left'}
            onValueChange={(value) => onChange({ alignment: value as 'left' | 'center' | 'right' })}
            disabled={disabled}
          >
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="left">左揃え</Select.Item>
              <Select.Item value="center">中央揃え</Select.Item>
              <Select.Item value="right">右揃え</Select.Item>
            </Select.Content>
          </Select.Root>
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
              disabled={disabled}
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
            onValueChange={(value) => onChange({ blendMode: value as BlendMode })}
            disabled={disabled}
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
}); 