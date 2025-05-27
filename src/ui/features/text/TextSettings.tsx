import React, { memo } from 'react';
import { BlendMode } from '../../../core/types/base';
import { TextEffectConfig } from '../../../core/types/effect';
import { Flex, Box, Text, Select, Slider, TextArea } from '@radix-ui/themes';
import { ColorInput } from '../../common/ColorInput';
import styled from 'styled-components';
import '../../EffectSettings.css';

interface TextSettingsProps {
  config: TextEffectConfig;
  onChange: (newConfig: Partial<TextEffectConfig>) => void;
  disabled?: boolean;
}

const CompactGroup = styled.div`
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const CompactLabel = styled(Text)`
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 4px;
`;

const CompactRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
`;

const SmallInput = styled.input`
  width: 50px;
  padding: 2px 4px;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-size: 11px;
  text-align: center;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CompactTextArea = styled(TextArea)`
  min-height: 60px;
  font-size: 12px;
`;

// サポートしているフォント（システムフォント中心）
const supportedFonts = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Meiryo', label: 'メイリオ' },
  { value: 'Yu Gothic', label: '游ゴシック' },
  { value: 'Yu Mincho', label: '游明朝' }
];

// サポートしているフォントウェイト
const supportedWeights = [
  { value: 'normal', label: '標準' },
  { value: 'bold', label: '太字' },
  { value: '300', label: 'Light' },
  { value: '500', label: 'Medium' },
  { value: '700', label: 'Bold' }
];

export const TextSettings = memo<TextSettingsProps>(({
  config,
  onChange,
  disabled = false
}) => {
  return (
    <div className="effect-settings">
      <Flex direction="column" gap="2">
        {/* テキスト内容 */}
        <CompactGroup>
          <CompactLabel>テキスト</CompactLabel>
          <CompactTextArea
            value={config.text}
            onChange={(e) => onChange({ text: e.target.value })}
            rows={2}
            disabled={disabled}
            size="1"
          />
        </CompactGroup>

        {/* 位置設定（%表示） */}
        <CompactGroup>
          <CompactLabel>位置 (%)</CompactLabel>
          <CompactRow>
            <Text size="1">X:</Text>
            <SmallInput
              type="number"
              value={(config.position.x * 100).toFixed(0)}
              onChange={(e) => onChange({
                position: {
                  x: Number(e.target.value) / 100,
                  y: config.position.y
                }
              })}
              min={-50}
              max={150}
              disabled={disabled}
            />
            <Text size="1">Y:</Text>
            <SmallInput
              type="number"
              value={(config.position.y * 100).toFixed(0)}
              onChange={(e) => onChange({
                position: {
                  x: config.position.x,
                  y: Number(e.target.value) / 100
                }
              })}
              min={-50}
              max={150}
              disabled={disabled}
            />
          </CompactRow>
        </CompactGroup>

        {/* フォント設定 */}
        <CompactGroup>
          <CompactLabel>フォント</CompactLabel>
          <Select.Root
            value={config.font.family}
            onValueChange={(value) => onChange({
              font: {
                ...config.font,
                family: value
              }
            })}
            disabled={disabled}
            size="1"
          >
            <Select.Trigger />
            <Select.Content>
              {supportedFonts.map(font => (
                <Select.Item key={font.value} value={font.value}>
                  {font.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </CompactGroup>

        {/* サイズ・太さ */}
        <CompactGroup>
          <CompactLabel>サイズ・太さ</CompactLabel>
          <CompactRow>
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
              size="1"
              style={{ flex: 1 }}
            />
            <Text size="1" style={{ minWidth: '30px' }}>{config.font.size}px</Text>
          </CompactRow>
          <Select.Root
            value={config.font.weight?.toString() ?? 'normal'}
            onValueChange={(value) => onChange({
              font: {
                ...config.font,
                weight: value
              }
            })}
            disabled={disabled}
            size="1"
          >
            <Select.Trigger />
            <Select.Content>
              {supportedWeights.map(weight => (
                <Select.Item key={weight.value} value={weight.value}>
                  {weight.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </CompactGroup>

        {/* 色・配置 */}
        <CompactGroup>
          <CompactLabel>色・配置</CompactLabel>
          <CompactRow>
            <ColorInput
              value={config.color}
              onChange={(value) => onChange({ color: value })}
              disabled={disabled}
            />
            <Select.Root
              value={config.alignment ?? 'left'}
              onValueChange={(value) => onChange({ alignment: value as 'left' | 'center' | 'right' })}
              disabled={disabled}
              size="1"
            >
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="left">左</Select.Item>
                <Select.Item value="center">中央</Select.Item>
                <Select.Item value="right">右</Select.Item>
              </Select.Content>
            </Select.Root>
          </CompactRow>
        </CompactGroup>

        {/* 不透明度 */}
        <CompactGroup>
          <CompactLabel>不透明度</CompactLabel>
          <Flex gap="2" align="center">
            <Slider
              value={[config.opacity ?? 1]}
              min={0}
              max={1}
              step={0.1}
              onValueChange={(value) => onChange({ opacity: value[0] })}
              disabled={disabled}
              size="1"
            />
            <Text size="1" style={{ minWidth: '30px' }}>{((config.opacity ?? 1) * 100).toFixed(0)}%</Text>
          </Flex>
        </CompactGroup>

        {/* ブレンドモード（サポートしているもののみ） */}
        <CompactGroup>
          <CompactLabel>ブレンドモード</CompactLabel>
          <Select.Root
            value={config.blendMode ?? 'source-over'}
            onValueChange={(value) => onChange({ blendMode: value as BlendMode })}
            disabled={disabled}
            size="1"
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
        </CompactGroup>
      </Flex>
    </div>
  );
});
<<<<<<< HEAD

TextSettings.displayName = 'TextSettings'; 
=======
>>>>>>> 4b34a4e5aa778551329353847f0a002c35789a9f
