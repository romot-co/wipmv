import React, { memo } from 'react';
import { BackgroundEffectConfig } from '../../../core/types/effect';
import { Flex, Box, Text, Select, Slider } from '@radix-ui/themes';
import { ImageUploader } from '../../common/ImageUploader';
import { ColorInput } from '../../common/ColorInput';
import { BlendMode } from '../../../core/types/base';
import styled from 'styled-components';
import '../../EffectSettings.css';

/**
 * 背景エフェクト設定のプロパティ
 */
interface BackgroundSettingsProps {
  config: BackgroundEffectConfig;
  onChange: (newConfig: Partial<BackgroundEffectConfig>) => void;
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
  width: 45px;
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

const defaultPosition = { x: 0, y: 0 };
const defaultSize = { width: 100, height: 100 };
const defaultImagePosition = { x: 50, y: 50 };
const defaultGradientColors: [string, string] = ['#000000', '#ffffff'];

// サポートしているブレンドモード（実際に動作確認済みのもの）
const supportedBlendModes: BlendMode[] = [
  'source-over',
  'multiply', 
  'screen',
  'overlay',
  'darken',
  'lighten'
];

/**
 * 背景エフェクト設定コンポーネント（コンパクト版）
 * - 実際にサポートしている機能のみ表示
 * - コンパクトなUI設計
 * - 効率的なスペース利用
 */
export const BackgroundSettings = memo<BackgroundSettingsProps>(({
  config,
  onChange,
  disabled = false
}) => {
  return (
    <div className="effect-settings">
      <Flex direction="column" gap="2">
        {/* 位置・サイズ設定（背景では相対座標のみサポート） */}
        <CompactGroup>
          <CompactLabel>位置・サイズ (%)</CompactLabel>
          <CompactRow>
            <Text size="1">X:</Text>
            <SmallInput
              type="number"
              value={(config.position || defaultPosition).x * 100}
              onChange={(e) => onChange({
                position: {
                  x: Number(e.target.value) / 100,
                  y: (config.position || defaultPosition).y
                }
              })}
              min={-100}
              max={200}
              disabled={disabled}
            />
            <Text size="1">Y:</Text>
            <SmallInput
              type="number"
              value={(config.position || defaultPosition).y * 100}
              onChange={(e) => onChange({
                position: {
                  x: (config.position || defaultPosition).x,
                  y: Number(e.target.value) / 100
                }
              })}
              min={-100}
              max={200}
              disabled={disabled}
            />
          </CompactRow>
          <CompactRow>
            <Text size="1">W:</Text>
            <SmallInput
              type="number"
              value={(config.size || defaultSize).width}
              onChange={(e) => onChange({
                size: {
                  width: Number(e.target.value),
                  height: (config.size || defaultSize).height
                }
              })}
              min={1}
              max={200}
              disabled={disabled}
            />
            <Text size="1">H:</Text>
            <SmallInput
              type="number"
              value={(config.size || defaultSize).height}
              onChange={(e) => onChange({
                size: {
                  width: (config.size || defaultSize).width,
                  height: Number(e.target.value)
                }
              })}
              min={1}
              max={200}
              disabled={disabled}
            />
          </CompactRow>
        </CompactGroup>

        {/* 背景種類 */}
        <CompactGroup>
          <CompactLabel>背景種類</CompactLabel>
          <Select.Root
            value={config.backgroundType || 'solid'}
            onValueChange={(value) => onChange({ backgroundType: value as BackgroundEffectConfig['backgroundType'] })}
            disabled={disabled}
            size="1"
          >
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="solid">単色</Select.Item>
              <Select.Item value="gradient">グラデーション</Select.Item>
              <Select.Item value="image">画像</Select.Item>
            </Select.Content>
          </Select.Root>
        </CompactGroup>

        {/* 単色背景 */}
        {(config.backgroundType || 'solid') === 'solid' && (
          <CompactGroup>
            <CompactLabel>背景色</CompactLabel>
            <ColorInput
              value={config.color || '#000000'}
              onChange={(value) => onChange({ color: value })}
              disabled={disabled}
            />
          </CompactGroup>
        )}

        {/* グラデーション背景 */}
        {(config.backgroundType || 'solid') === 'gradient' && (
          <>
            <CompactGroup>
              <CompactLabel>グラデーション</CompactLabel>
              <CompactRow>
                <ColorInput
                  value={(config.gradientColors || defaultGradientColors)[0]}
                  onChange={(value) => {
                    const colors = [...(config.gradientColors || defaultGradientColors)];
                    colors[0] = value;
                    onChange({ gradientColors: colors as [string, string] });
                  }}
                  disabled={disabled}
                />
                <Text size="1">→</Text>
                <ColorInput
                  value={(config.gradientColors || defaultGradientColors)[1]}
                  onChange={(value) => {
                    const colors = [...(config.gradientColors || defaultGradientColors)];
                    colors[1] = value;
                    onChange({ gradientColors: colors as [string, string] });
                  }}
                  disabled={disabled}
                />
              </CompactRow>
            </CompactGroup>

            <CompactGroup>
              <CompactLabel>方向</CompactLabel>
              <Select.Root
                value={config.gradientDirection || 'horizontal'}
                onValueChange={(value) => onChange({ gradientDirection: value as 'horizontal' | 'vertical' | 'radial' })}
                disabled={disabled}
                size="1"
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="horizontal">水平</Select.Item>
                  <Select.Item value="vertical">垂直</Select.Item>
                  <Select.Item value="radial">放射状</Select.Item>
                </Select.Content>
              </Select.Root>
            </CompactGroup>
          </>
        )}

        {/* 画像背景 */}
        {(config.backgroundType || 'solid') === 'image' && (
          <>
            <CompactGroup>
              <CompactLabel>背景画像</CompactLabel>
              <ImageUploader
                label=""
                value={config.imageUrl || ''}
                onChange={(url) => onChange({ imageUrl: url })}
                accept="image/*"
                disabled={disabled}
              />
            </CompactGroup>

            <CompactGroup>
              <CompactLabel>画像サイズ</CompactLabel>
              <Select.Root
                value={config.imageSize || 'cover'}
                onValueChange={(value) => onChange({ imageSize: value as 'cover' | 'contain' | 'stretch' })}
                disabled={disabled}
                size="1"
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="cover">カバー</Select.Item>
                  <Select.Item value="contain">コンテイン</Select.Item>
                  <Select.Item value="stretch">ストレッチ</Select.Item>
                </Select.Content>
              </Select.Root>
            </CompactGroup>

            <CompactGroup>
              <CompactLabel>画像位置 (%)</CompactLabel>
              <CompactRow>
                <Text size="1">X:</Text>
                <SmallInput
                  type="number"
                  value={(config.imagePosition || defaultImagePosition).x}
                  onChange={(e) => onChange({
                    imagePosition: {
                      x: Number(e.target.value),
                      y: (config.imagePosition || defaultImagePosition).y
                    }
                  })}
                  min={0}
                  max={100}
                  disabled={disabled}
                />
                <Text size="1">Y:</Text>
                <SmallInput
                  type="number"
                  value={(config.imagePosition || defaultImagePosition).y}
                  onChange={(e) => onChange({
                    imagePosition: {
                      x: (config.imagePosition || defaultImagePosition).x,
                      y: Number(e.target.value)
                    }
                  })}
                  min={0}
                  max={100}
                  disabled={disabled}
                />
              </CompactRow>
            </CompactGroup>
          </>
        )}

        {/* 不透明度 */}
        <CompactGroup>
          <CompactLabel>不透明度</CompactLabel>
          <Flex gap="2" align="center">
            <Slider
              value={[config.opacity || 1]}
              min={0}
              max={1}
              step={0.1}
              onValueChange={(value) => onChange({ opacity: value[0] })}
              disabled={disabled}
              size="1"
            />
            <Text size="1" style={{ minWidth: '30px' }}>{((config.opacity || 1) * 100).toFixed(0)}%</Text>
          </Flex>
        </CompactGroup>

        {/* ブレンドモード（サポートしているもののみ） */}
        <CompactGroup>
          <CompactLabel>ブレンドモード</CompactLabel>
          <Select.Root
            value={config.blendMode || 'source-over'}
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

BackgroundSettings.displayName = 'BackgroundSettings';
