import React from 'react';
import { BackgroundEffectConfig } from '../../../core/types';
import { Flex, Box, Text, Select, Slider } from '@radix-ui/themes';
import { ImageUploader } from '../../common/ImageUploader';
import '../../EffectSettings.css';

interface BackgroundSettingsProps {
  config: BackgroundEffectConfig;
  onChange: (newConfig: Partial<BackgroundEffectConfig>) => void;
}

export const BackgroundSettings: React.FC<BackgroundSettingsProps> = ({
  config,
  onChange
}) => {
  return (
    <div className="effect-settings">
      <Flex direction="column" gap="3">
        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            背景種類
          </Text>
          <Select.Root
            value={config.backgroundType}
            onValueChange={(value) => onChange({ backgroundType: value as BackgroundEffectConfig['backgroundType'] })}
          >
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="solid">単色</Select.Item>
              <Select.Item value="gradient">グラデーション</Select.Item>
              <Select.Item value="image">画像</Select.Item>
            </Select.Content>
          </Select.Root>
        </Box>

        {config.backgroundType === 'solid' && (
          <Box>
            <Text as="label" size="2" weight="bold" mb="2">
              背景色
            </Text>
            <Flex gap="3" align="center">
              <input
                type="color"
                value={config.color ?? '#000000'}
                onChange={(e) => onChange({ color: e.target.value })}
                className="color-picker"
              />
              <input
                type="text"
                value={config.color ?? '#000000'}
                onChange={(e) => onChange({ color: e.target.value })}
                pattern="^#[0-9A-Fa-f]{6}$"
                className="color-input"
              />
            </Flex>
          </Box>
        )}

        {config.backgroundType === 'gradient' && (
          <>
            <Box>
              <Text as="label" size="2" weight="bold" mb="2">
                グラデーション開始色
              </Text>
              <Flex gap="3" align="center">
                <input
                  type="color"
                  value={config.gradientColors?.[0] ?? '#000000'}
                  onChange={(e) => {
                    const colors = [...(config.gradientColors ?? ['#000000', '#ffffff'])];
                    colors[0] = e.target.value;
                    onChange({ gradientColors: colors as [string, string] });
                  }}
                  className="color-picker"
                />
                <input
                  type="text"
                  value={config.gradientColors?.[0] ?? '#000000'}
                  onChange={(e) => {
                    const colors = [...(config.gradientColors ?? ['#000000', '#ffffff'])];
                    colors[0] = e.target.value;
                    onChange({ gradientColors: colors as [string, string] });
                  }}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  className="color-input"
                />
              </Flex>
            </Box>

            <Box>
              <Text as="label" size="2" weight="bold" mb="2">
                グラデーション終了色
              </Text>
              <Flex gap="3" align="center">
                <input
                  type="color"
                  value={config.gradientColors?.[1] ?? '#ffffff'}
                  onChange={(e) => {
                    const colors = [...(config.gradientColors ?? ['#000000', '#ffffff'])];
                    colors[1] = e.target.value;
                    onChange({ gradientColors: colors as [string, string] });
                  }}
                  className="color-picker"
                />
                <input
                  type="text"
                  value={config.gradientColors?.[1] ?? '#ffffff'}
                  onChange={(e) => {
                    const colors = [...(config.gradientColors ?? ['#000000', '#ffffff'])];
                    colors[1] = e.target.value;
                    onChange({ gradientColors: colors as [string, string] });
                  }}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  className="color-input"
                />
              </Flex>
            </Box>

            <Box>
              <Text as="label" size="2" weight="bold" mb="2">
                グラデーション方向
              </Text>
              <Select.Root
                value={config.gradientDirection ?? 'horizontal'}
                onValueChange={(value) => onChange({ gradientDirection: value as 'horizontal' | 'vertical' | 'radial' })}
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="horizontal">水平</Select.Item>
                  <Select.Item value="vertical">垂直</Select.Item>
                  <Select.Item value="radial">放射状</Select.Item>
                </Select.Content>
              </Select.Root>
            </Box>
          </>
        )}

        {config.backgroundType === 'image' && (
          <>
            <Box>
              <Text as="label" size="2" weight="bold" mb="2">
                背景画像
              </Text>
              <ImageUploader
                label=""
                value={config.imageUrl ?? ''}
                onChange={(url) => onChange({ imageUrl: url })}
                accept="image/*"
              />
            </Box>

            <Box>
              <Text as="label" size="2" weight="bold" mb="2">
                画像サイズ
              </Text>
              <Select.Root
                value={config.imageSize ?? 'cover'}
                onValueChange={(value) => onChange({ imageSize: value as 'cover' | 'contain' | 'stretch' })}
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="cover">カバー</Select.Item>
                  <Select.Item value="contain">コンテイン</Select.Item>
                  <Select.Item value="stretch">ストレッチ</Select.Item>
                </Select.Content>
              </Select.Root>
            </Box>

            <Box>
              <Text as="label" size="2" weight="bold" mb="2">
                画像位置
              </Text>
              <Flex direction="column" gap="2">
                <Flex gap="3" align="center">
                  <Text size="2" weight="medium">X座標</Text>
                  <input
                    type="number"
                    value={config.imagePosition?.x ?? 0}
                    onChange={(e) => onChange({
                      imagePosition: {
                        x: Number(e.target.value),
                        y: config.imagePosition?.y ?? 0
                      }
                    })}
                    className="number-input"
                  />
                </Flex>
                <Flex gap="3" align="center">
                  <Text size="2" weight="medium">Y座標</Text>
                  <input
                    type="number"
                    value={config.imagePosition?.y ?? 0}
                    onChange={(e) => onChange({
                      imagePosition: {
                        x: config.imagePosition?.x ?? 0,
                        y: Number(e.target.value)
                      }
                    })}
                    className="number-input"
                  />
                </Flex>
              </Flex>
            </Box>
          </>
        )}

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