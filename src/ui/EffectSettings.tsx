import React, { useState, useEffect } from 'react';
import { EffectBase } from '../core/EffectBase';
import { 
  EffectType,
  EffectConfig,
  Position2D,
  Size2D
} from '../core/types';
import { EffectTimeSettings } from './EffectTimeSettings';
import { Card, Flex, Text, Heading, Switch } from '@radix-ui/themes';
import * as Select from '@radix-ui/react-select';
import * as Slider from '@radix-ui/react-slider';
import { ColorPicker } from './common/ColorPicker';
import { PositionPicker } from '../ui/common/PositionPicker';
import { ImageUploader } from './common/ImageUploader';
import './EffectSettings.css';

interface EffectSettingsProps {
  effect: EffectBase<EffectConfig>;
  onUpdate: (config: Partial<EffectConfig>) => void;
  duration: number;
}

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1
}) => (
  <Flex direction="column" gap="1">
    <Text as="label" size="2">{label}</Text>
    <Slider.Root
      value={[value]}
      onValueChange={([v]) => onChange(v)}
      min={min}
      max={max}
      step={step}
    >
      <Slider.Track>
        <Slider.Range />
      </Slider.Track>
      <Slider.Thumb />
    </Slider.Root>
  </Flex>
);

const TextArea: React.FC<TextAreaProps> = ({
  label,
  value,
  onChange,
  placeholder
}) => (
  <Flex direction="column" gap="1">
    <Text as="label" size="2">{label}</Text>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="rt-TextAreaInput"
    />
  </Flex>
);

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

  const handleConfigChange = (newConfig: Partial<EffectConfig>) => {
    onUpdate(newConfig);
    setConfig(prev => ({ ...prev, ...newConfig } as EffectConfig));
  };

  const renderEffectSpecificSettings = () => {
    switch (config.type) {
      case EffectType.Background:
        return (
          <Flex direction="column" gap="2">
            <ImageUploader
              label="背景画像"
              value={config.imageUrl ?? ''}
              onChange={(url: string) => handleConfigChange({ imageUrl: url })}
              accept="image/*"
              placeholder="画像URLを入力またはファイルを選択"
            />
            <ColorPicker
              label="背景色"
              value={config.color ?? '#000000'}
              onChange={(color: string) => handleConfigChange({ color })}
            />
            <Select.Root
              value={config.fitMode}
              onValueChange={(value: 'cover' | 'contain') => handleConfigChange({ fitMode: value })}
            >
              <Select.Trigger>
                <Select.Value placeholder="フィットモード" />
              </Select.Trigger>
              <Select.Portal>
                <Select.Content>
                  <Select.Item value="cover">カバー</Select.Item>
                  <Select.Item value="contain">収める</Select.Item>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </Flex>
        );

      case EffectType.Watermark:
        return (
          <Flex direction="column" gap="2">
            <ImageUploader
              label="透かし画像"
              value={config.imageUrl ?? ''}
              onChange={(url: string) => handleConfigChange({ imageUrl: url })}
              accept="image/*"
              placeholder="画像URLを入力またはファイルを選択"
            />
            <NumberInput
              label="サイズ"
              value={config.size?.width ?? 100}
              onChange={(value: number) => handleConfigChange({
                size: { width: value, height: value } as Size2D
              })}
              min={1}
              max={1000}
            />
            <PositionPicker
              label="位置"
              value={config.position ?? { x: 0, y: 0 }}
              onChange={(position: Position2D) => handleConfigChange({ position })}
            />
          </Flex>
        );

      case EffectType.Waveform:
        return (
          <Flex direction="column" gap="2">
            <Select.Root
              value={config.waveformType}
              onValueChange={(value: 'bar' | 'line' | 'circle') => handleConfigChange({ waveformType: value })}
            >
              <Select.Trigger>
                <Select.Value placeholder="波形タイプ" />
              </Select.Trigger>
              <Select.Portal>
                <Select.Content>
                  <Select.Item value="bar">バー</Select.Item>
                  <Select.Item value="line">ライン</Select.Item>
                  <Select.Item value="circle">サークル</Select.Item>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
            <ColorPicker
              label="波形の色"
              value={config.color ?? '#ffffff'}
              onChange={(color: string) => handleConfigChange({ color })}
            />
            <NumberInput
              label="バーの幅"
              value={config.barWidth ?? 3}
              onChange={(value: number) => handleConfigChange({ barWidth: value })}
              min={1}
              max={20}
            />
            <NumberInput
              label="バーの間隔"
              value={config.barSpacing ?? 1}
              onChange={(value: number) => handleConfigChange({ barSpacing: value })}
              min={0}
              max={10}
            />
            <NumberInput
              label="感度"
              value={config.sensitivity ?? 2.0}
              onChange={(value: number) => handleConfigChange({ sensitivity: value })}
              min={0.1}
              max={10}
              step={0.1}
            />
            <Flex align="center" justify="between" gap="2">
              <Text as="label" size="2">ミラー表示</Text>
              <Switch
                checked={config.mirror ?? false}
                onCheckedChange={(checked) => handleConfigChange({ mirror: checked })}
              />
            </Flex>
          </Flex>
        );

      case EffectType.Text:
        return (
          <Flex direction="column" gap="2">
            <TextArea
              label="テキスト"
              value={config.text ?? ''}
              onChange={(value: string) => handleConfigChange({ text: value })}
              placeholder="テキストを入力"
            />
            <Select.Root
              value={config.fontFamily}
              onValueChange={(value: string) => handleConfigChange({ fontFamily: value })}
            >
              <Select.Trigger>
                <Select.Value placeholder="フォント" />
              </Select.Trigger>
              <Select.Portal>
                <Select.Content>
                  <Select.Item value="Arial">Arial</Select.Item>
                  <Select.Item value="Times New Roman">Times New Roman</Select.Item>
                  <Select.Item value="Courier New">Courier New</Select.Item>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
            <NumberInput
              label="フォントサイズ"
              value={config.fontSize ?? 48}
              onChange={(value: number) => handleConfigChange({ fontSize: value })}
              min={8}
              max={200}
            />
            <ColorPicker
              label="テキストの色"
              value={config.color ?? '#ffffff'}
              onChange={(color: string) => handleConfigChange({ color })}
            />
            <Select.Root
              value={config.align}
              onValueChange={(value: CanvasTextAlign) => handleConfigChange({ align: value })}
            >
              <Select.Trigger>
                <Select.Value placeholder="配置" />
              </Select.Trigger>
              <Select.Portal>
                <Select.Content>
                  <Select.Item value="left">左揃え</Select.Item>
                  <Select.Item value="center">中央揃え</Select.Item>
                  <Select.Item value="right">右揃え</Select.Item>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
            <PositionPicker
              label="位置"
              value={config.position ?? { x: 0.5, y: 0.5 }}
              onChange={(position: Position2D) => handleConfigChange({ position })}
            />
          </Flex>
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