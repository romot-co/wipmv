import React, { memo } from 'react';
import { WaveformEffectConfig } from '../../../core/types/effect';
import { BlendMode } from '../../../core/types/base';
import { Flex, Box, Text, Select, Slider, Switch } from '@radix-ui/themes';
import { ColorInput } from '../../common/ColorInput';
import styled from 'styled-components';
import '../../EffectSettings.css';

/**
 * 波形エフェクト設定のプロパティ
 */
interface WaveformSettingsProps {
  config: WaveformEffectConfig;
  onChange: (newConfig: Partial<WaveformEffectConfig>) => void;
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

const defaultMirror = { vertical: false, horizontal: false };
const defaultPosition = { x: 0, y: 0 };
const defaultSize = { width: 100, height: 100 };

/**
 * 波形エフェクト設定コンポーネント（コンパクト版）
 * - 実際にサポートしている機能のみ表示
 * - コンパクトなUI設計
 * - 効率的なスペース利用
 */
export const WaveformSettings = memo<WaveformSettingsProps>(({
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

        {/* 表示モード・タイプ */}
        <CompactGroup>
          <CompactLabel>表示モード</CompactLabel>
          <Select.Root
            value={config.displayMode || 'waveform'}
            onValueChange={(value) => onChange({ displayMode: value as 'waveform' | 'frequency' })}
            disabled={disabled}
            size="1"
          >
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="waveform">波形</Select.Item>
              <Select.Item value="frequency">周波数</Select.Item>
            </Select.Content>
          </Select.Root>
        </CompactGroup>

        <CompactGroup>
          <CompactLabel>波形タイプ</CompactLabel>
          <Select.Root
            value={config.waveformType || 'bar'}
            onValueChange={(value) => onChange({ waveformType: value as 'bar' | 'line' | 'circle' })}
            disabled={disabled}
            size="1"
          >
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="bar">バー</Select.Item>
              <Select.Item value="line">ライン</Select.Item>
              <Select.Item value="circle">サークル</Select.Item>
            </Select.Content>
          </Select.Root>
        </CompactGroup>

        {/* チャンネルモード */}
        <CompactGroup>
          <CompactLabel>チャンネル</CompactLabel>
          <Select.Root
            value={config.channelMode || 'mono'}
            onValueChange={(value) => onChange({ channelMode: value as 'mono' | 'stereo' })}
            disabled={disabled}
            size="1"
          >
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="mono">モノラル</Select.Item>
              <Select.Item value="stereo">ステレオ</Select.Item>
            </Select.Content>
          </Select.Root>
        </CompactGroup>

        {/* バー設定（バータイプの場合のみ） */}
        {config.waveformType === 'bar' && (
          <CompactGroup>
            <CompactLabel>バー設定</CompactLabel>
            <CompactRow>
              <Text size="1">幅:</Text>
              <SmallInput
                type="number"
                value={config.barWidth || 4}
                onChange={(e) => onChange({ barWidth: Number(e.target.value) })}
                min={1}
                max={20}
                disabled={disabled}
              />
              <Text size="1">間隔:</Text>
              <SmallInput
                type="number"
                value={config.barGap || 2}
                onChange={(e) => onChange({ barGap: Number(e.target.value) })}
                min={0}
                max={10}
                disabled={disabled}
              />
            </CompactRow>
          </CompactGroup>
        )}

        {/* 色・感度 */}
        <CompactGroup>
          <CompactLabel>色・感度</CompactLabel>
          <CompactRow>
            <ColorInput
              value={config.color || '#ffffff'}
              onChange={(value) => onChange({ color: value })}
              disabled={disabled}
            />
            <Text size="1">感度:</Text>
            <SmallInput
              type="number"
              value={config.sensitivity || 1}
              onChange={(e) => onChange({ sensitivity: Number(e.target.value) })}
              min={0.1}
              max={5}
              step={0.1}
              disabled={disabled}
            />
          </CompactRow>
        </CompactGroup>

        {/* ミラー効果 */}
        <CompactGroup>
          <CompactLabel>ミラー効果</CompactLabel>
          <CompactRow>
            <Text size="1">縦:</Text>
            <Switch
              checked={config.mirror?.vertical ?? false}
              onCheckedChange={(checked) => onChange({
                mirror: {
                  ...(config.mirror || defaultMirror),
                  vertical: checked
                }
              })}
              disabled={disabled}
              size="1"
            />
            <Text size="1">横:</Text>
            <Switch
              checked={config.mirror?.horizontal ?? false}
              onCheckedChange={(checked) => onChange({
                mirror: {
                  ...(config.mirror || defaultMirror),
                  horizontal: checked
                }
              })}
              disabled={disabled}
              size="1"
            />
          </CompactRow>
        </CompactGroup>

        {/* スムージング */}
        <CompactGroup>
          <CompactLabel>スムージング</CompactLabel>
          <Flex gap="2" align="center">
            <Slider
              value={[config.smoothingFactor || 0.5]}
              min={0}
              max={1}
              step={0.1}
              onValueChange={(value) => onChange({ smoothingFactor: value[0] })}
              disabled={disabled}
              size="1"
            />
            <Text size="1" style={{ minWidth: '30px' }}>{((config.smoothingFactor || 0.5) * 100).toFixed(0)}%</Text>
          </Flex>
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

WaveformSettings.displayName = 'WaveformSettings'; 