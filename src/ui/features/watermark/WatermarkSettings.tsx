import React from 'react';
import { WatermarkEffectConfig } from '../../../core/types';
import { Flex, Box, Text, Select, Slider, Switch } from '@radix-ui/themes';
import { ImageUploader } from '../../common/ImageUploader';
import '../../EffectSettings.css';

interface WatermarkSettingsProps {
  config: WatermarkEffectConfig;
  onChange: (newConfig: Partial<WatermarkEffectConfig>) => void;
}

export const WatermarkSettings: React.FC<WatermarkSettingsProps> = ({
  config,
  onChange
}) => {
  return (
    <div className="effect-settings">
      <Flex direction="column" gap="3">
        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            透かし画像
          </Text>
          <ImageUploader
            label=""
            value={config.imageUrl}
            onChange={(url) => onChange({ imageUrl: url })}
            accept="image/*"
          />
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            位置
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
              />
            </Flex>
          </Flex>
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            サイズ
          </Text>
          <Flex direction="column" gap="2">
            <Flex gap="3" align="center">
              <Text size="2" weight="medium">幅</Text>
              <input
                type="number"
                value={config.size.width}
                onChange={(e) => onChange({
                  size: {
                    width: Number(e.target.value),
                    height: config.size.height
                  }
                })}
                className="number-input"
              />
            </Flex>
            <Flex gap="3" align="center">
              <Text size="2" weight="medium">高さ</Text>
              <input
                type="number"
                value={config.size.height}
                onChange={(e) => onChange({
                  size: {
                    width: config.size.width,
                    height: Number(e.target.value)
                  }
                })}
                className="number-input"
              />
            </Flex>
          </Flex>
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            回転角度
          </Text>
          <Flex gap="3" align="center">
            <Slider
              value={[config.rotation ?? 0]}
              min={0}
              max={360}
              step={1}
              onValueChange={(value) => onChange({ rotation: value[0] })}
            />
            <Text size="2">{config.rotation ?? 0}°</Text>
          </Flex>
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            繰り返し
          </Text>
          <Switch
            checked={config.repeat ?? false}
            onCheckedChange={(checked) => onChange({ repeat: checked })}
          />
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