import React, { memo } from 'react';
import { BackgroundEffectConfig } from '../../../core/types/effect';
import { Flex, Box, Text, Select, Slider } from '@radix-ui/themes';
import { ImageUploader } from '../../common/ImageUploader';
import { CoordinateSystemSettings } from '../../common/CoordinateSystemSettings';
import { ColorInput } from '../../common/ColorInput';
import { BlendMode } from '../../../core/types/base';
import '../../EffectSettings.css';

/**
 * 背景エフェクト設定のプロパティ
 */
interface BackgroundSettingsProps {
  config: BackgroundEffectConfig;
  onChange: (newConfig: Partial<BackgroundEffectConfig>) => void;
  disabled?: boolean;
}

const defaultPosition = { x: 0, y: 0 };
const defaultSize = { width: 100, height: 100 };
const defaultImagePosition = { x: 50, y: 50 };
const defaultGradientColors: [string, string] = ['#000000', '#ffffff'];

/**
 * 背景エフェクト設定コンポーネント
 * - 背景の種類（単色/グラデーション/画像）
 * - 色や画像の設定
 * - 位置やサイズの調整
 */
export const BackgroundSettings = memo<BackgroundSettingsProps>(({
  config,
  onChange,
  disabled = false
}) => {
  return (
    <div className="effect-settings">
      <Flex direction="column" gap="3">
        <CoordinateSystemSettings
          coordinateSystem={config.coordinateSystem || 'relative'}
          position={config.position || defaultPosition}
          size={config.size || defaultSize}
          onCoordinateSystemChange={(value) => onChange({ coordinateSystem: value })}
          onPositionChange={(position) => onChange({ position })}
          onSizeChange={(size) => onChange({ size })}
          disabled={disabled}
        />

        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            背景種類
          </Text>
          <Select.Root
            value={config.backgroundType || 'solid'}
            onValueChange={(value) => onChange({ backgroundType: value as BackgroundEffectConfig['backgroundType'] })}
            disabled={disabled}
          >
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="solid">単色</Select.Item>
              <Select.Item value="gradient">グラデーション</Select.Item>
              <Select.Item value="image">画像</Select.Item>
            </Select.Content>
          </Select.Root>
        </Box>

        {(config.backgroundType || 'solid') === 'solid' && (
          <Box>
            <Text as="label" size="2" weight="bold" mb="2">
              背景色
            </Text>
            <ColorInput
              value={config.color || '#000000'}
              onChange={(value) => onChange({ color: value })}
              disabled={disabled}
            />
          </Box>
        )}

        {(config.backgroundType || 'solid') === 'gradient' && (
          <>
            <Box>
              <Text as="label" size="2" weight="bold" mb="2">
                グラデーション開始色
              </Text>
              <ColorInput
                value={(config.gradientColors || defaultGradientColors)[0]}
                onChange={(value) => {
                  const colors = [...(config.gradientColors || defaultGradientColors)];
                  colors[0] = value;
                  onChange({ gradientColors: colors as [string, string] });
                }}
                disabled={disabled}
              />
            </Box>

            <Box>
              <Text as="label" size="2" weight="bold" mb="2">
                グラデーション終了色
              </Text>
              <ColorInput
                value={(config.gradientColors || defaultGradientColors)[1]}
                onChange={(value) => {
                  const colors = [...(config.gradientColors || defaultGradientColors)];
                  colors[1] = value;
                  onChange({ gradientColors: colors as [string, string] });
                }}
                disabled={disabled}
              />
            </Box>

            <Box>
              <Text as="label" size="2" weight="bold" mb="2">
                グラデーション方向
              </Text>
              <Select.Root
                value={config.gradientDirection || 'horizontal'}
                onValueChange={(value) => onChange({ gradientDirection: value as 'horizontal' | 'vertical' | 'radial' })}
                disabled={disabled}
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

        {(config.backgroundType || 'solid') === 'image' && (
          <>
            <Box>
              <Text as="label" size="2" weight="bold" mb="2">
                背景画像
              </Text>
              <ImageUploader
                label=""
                value={config.imageUrl || ''}
                onChange={(url) => onChange({ imageUrl: url })}
                accept="image/*"
                disabled={disabled}
              />
            </Box>

            <Box>
              <Text as="label" size="2" weight="bold" mb="2">
                画像サイズ
              </Text>
              <Select.Root
                value={config.imageSize || 'cover'}
                onValueChange={(value) => onChange({ imageSize: value as 'cover' | 'contain' | 'stretch' })}
                disabled={disabled}
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
                    value={(config.imagePosition || defaultImagePosition).x}
                    onChange={(e) => onChange({
                      imagePosition: {
                        x: Number(e.target.value),
                        y: (config.imagePosition || defaultImagePosition).y
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
                    value={(config.imagePosition || defaultImagePosition).y}
                    onChange={(e) => onChange({
                      imagePosition: {
                        x: (config.imagePosition || defaultImagePosition).x,
                        y: Number(e.target.value)
                      }
                    })}
                    className="number-input"
                    disabled={disabled}
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
              value={[config.opacity || 1]}
              min={0}
              max={1}
              step={0.1}
              onValueChange={(value) => onChange({ opacity: value[0] })}
              disabled={disabled}
            />
            <Text size="2">{config.opacity || 1}</Text>
          </Flex>
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            ブレンドモード
          </Text>
          <Select.Root
            value={config.blendMode || 'source-over'}
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

BackgroundSettings.displayName = 'BackgroundSettings'; 