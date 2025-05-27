import React, { memo } from 'react';
import { WatermarkEffectConfig } from '../../../core/types/effect';
import { BlendMode } from '../../../core/types/base';
import { Flex, Box, Text, Select, Slider, Switch } from '@radix-ui/themes';
import { ImageUploader } from '../../common/ImageUploader';
import styled from 'styled-components';
import '../../EffectSettings.css';

/**
 * 透かしエフェクト設定のプロパティ
 */
interface WatermarkSettingsProps {
  config: WatermarkEffectConfig;
  onChange: (newConfig: Partial<WatermarkEffectConfig>) => void;
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

const defaultPosition = { x: 0, y: 0 };
const defaultSize = { width: 100, height: 100 };

/**
 * 透かしエフェクト設定コンポーネント（コンパクト版）
 * - 画像の選択とプレビュー
 * - 位置とサイズの調整
 * - 回転と繰り返しの設定（実際にサポートしている機能のみ）
 */
export const WatermarkSettings = memo<WatermarkSettingsProps>(({
  config,
  onChange,
  disabled = false
}) => {
  return (
    <div className="effect-settings">
      <Flex direction="column" gap="2">
        {/* 位置・サイズ設定（%表示） */}
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
              min={-50}
              max={150}
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
              min={-50}
              max={150}
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

        {/* 透かし画像 */}
        <CompactGroup>
          <CompactLabel>透かし画像</CompactLabel>
          <ImageUploader
            label=""
            value={config.imageUrl || ''}
            onChange={(url) => onChange({ imageUrl: url })}
            accept="image/*"
            disabled={disabled}
          />
        </CompactGroup>

        {/* 回転角度 */}
        <CompactGroup>
          <CompactLabel>回転角度</CompactLabel>
          <Flex gap="2" align="center">
            <Slider
              value={[config.rotation || 0]}
              min={0}
              max={360}
              step={1}
              onValueChange={(value) => onChange({ rotation: value[0] })}
              disabled={disabled}
              size="1"
            />
            <Text size="1" style={{ minWidth: '40px' }}>{config.rotation || 0}°</Text>
          </Flex>
        </CompactGroup>

        {/* 不透明度 */}
        <CompactGroup>
          <CompactLabel>不透明度</CompactLabel>
          <Flex gap="2" align="center">
            <Slider
              value={[config.opacity || 0.5]}
              min={0}
              max={1}
              step={0.1}
              onValueChange={(value) => onChange({ opacity: value[0] })}
              disabled={disabled}
              size="1"
            />
            <Text size="1" style={{ minWidth: '30px' }}>{((config.opacity || 0.5) * 100).toFixed(0)}%</Text>
          </Flex>
        </CompactGroup>

        {/* 繰り返し */}
        <CompactGroup>
          <CompactLabel>オプション</CompactLabel>
          <CompactRow>
            <Text size="1">繰り返し:</Text>
            <Switch
              checked={config.repeat || false}
              onCheckedChange={(checked) => onChange({ repeat: checked })}
              disabled={disabled}
              size="1"
            />
          </CompactRow>
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

WatermarkSettings.displayName = 'WatermarkSettings';
