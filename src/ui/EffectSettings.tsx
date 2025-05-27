import React, { useState, useEffect, memo } from 'react';
import { Card, Flex, Heading, Text, Switch, Separator, Badge, IconButton, Tooltip } from '@radix-ui/themes';
import { EyeOpenIcon, EyeClosedIcon, LayersIcon, ClockIcon } from '@radix-ui/react-icons';
import { EffectBase } from '../core/types/core';
import { BackgroundEffectConfig, TextEffectConfig, WaveformEffectConfig, WatermarkEffectConfig } from '../core/types/effect';
import { AppError, ErrorType } from '../core/types/error';
import { EffectTimeSettings } from './EffectTimeSettings';
import { BackgroundSettings } from './features/background/BackgroundSettings';
import { WatermarkSettings } from './features/watermark/WatermarkSettings';
import { WaveformSettings } from './features/waveform/WaveformSettings';
import { TextSettings } from './features/text/TextSettings';
import styled from 'styled-components';
import './EffectSettings.css';

type EffectConfig = BackgroundEffectConfig | TextEffectConfig | WaveformEffectConfig | WatermarkEffectConfig;

const SettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
`;

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: var(--bg-secondary);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--border-color);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background-color: var(--text-muted);
  }
`;

const CompactSection = styled(Card)`
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
`;

const SectionTitle = styled.h4`
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
`;

const SectionIcon = styled.div`
  color: var(--primary-color);
  display: flex;
  align-items: center;
  font-size: 12px;
`;

const CompactControlRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  min-height: 24px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const CompactLabel = styled(Text)`
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 60px;
`;

const CompactValue = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  justify-content: flex-end;
`;

const CompactInput = styled.input`
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
    box-shadow: 0 0 0 1px var(--primary-color)40;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CompactBadge = styled(Badge)`
  font-size: 10px;
  padding: 2px 4px;
`;

/**
 * エフェクト設定のプロパティ
 */
interface EffectSettingsProps {
  effect: EffectBase<EffectConfig>;
  onUpdate: (config: Partial<EffectConfig>) => void;
  onError?: (error: AppError) => void;
  duration?: number;
  disabled?: boolean;
}

// エフェクトタイプのアイコンとラベル
const effectTypeInfo: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  background: { icon: <LayersIcon width="12" height="12" />, label: '背景', color: 'blue' },
  text: { icon: <span style={{ fontSize: '10px' }}>T</span>, label: 'テキスト', color: 'purple' },
  waveform: { icon: <span style={{ fontSize: '8px' }}>♪</span>, label: '波形', color: 'red' },
  watermark: { icon: <span style={{ fontSize: '8px' }}>🏷️</span>, label: '透かし', color: 'green' }
};

/**
 * エフェクト設定コンポーネント
 * - コンパクトなデザインでスクロール対応
 * - サポートしている値のみ表示
 * - 最適化されたUI/UX
 */
export const EffectSettings = memo<EffectSettingsProps>(({
  effect,
  onUpdate,
  onError,
  duration,
  disabled = false
}) => {
  const [config, setConfig] = useState<EffectConfig>(effect.getConfig());

  useEffect(() => {
    try {
      const newConfig = effect.getConfig();
      console.log('エフェクト設定更新:', { effectId: effect.getId(), newConfig });
      setConfig(newConfig);
    } catch (error) {
      onError?.(new AppError(
        ErrorType.EffectError,
        'エフェクト設定の取得に失敗しました'
      ));
    }
  }, [effect, onError]);

  const handleTimeChange = (startTime: number, endTime: number) => {
    try {
      const newConfig = {
        startTime,
        endTime,
      };
      onUpdate(newConfig);
      setConfig(prev => ({ ...prev, ...newConfig }));
    } catch (error) {
      onError?.(new AppError(
        ErrorType.EffectError,
        '時間設定の更新に失敗しました'
      ));
    }
  };

  const handleConfigChange = (newConfig: Partial<EffectConfig>) => {
    try {
      onUpdate(newConfig);
      setConfig(prev => ({ ...prev, ...newConfig } as EffectConfig));
    } catch (error) {
      onError?.(new AppError(
        ErrorType.EffectError,
        'エフェクト設定の更新に失敗しました'
      ));
    }
  };

  const renderEffectSpecificSettings = () => {
    try {
      switch (config.type) {
        case 'background':
          return (
            <BackgroundSettings
              config={config}
              onChange={handleConfigChange}
              disabled={disabled}
            />
          );
        case 'text':
          return (
            <TextSettings
              config={config}
              onChange={handleConfigChange}
              disabled={disabled}
            />
          );
        case 'waveform':
          return (
            <WaveformSettings
              config={config}
              onChange={handleConfigChange}
              disabled={disabled}
            />
          );
        case 'watermark':
          return (
            <WatermarkSettings
              config={config}
              onChange={handleConfigChange}
              disabled={disabled}
            />
          );
        default:
          onError?.(new AppError(
            ErrorType.EffectError,
            `未対応のエフェクトタイプです`
          ));
          return null;
      }
    } catch (error) {
      onError?.(new AppError(
        ErrorType.EffectError,
        'エフェクト固有の設定の描画に失敗しました'
      ));
      return null;
    }
  };

  const effectInfo = effectTypeInfo[config.type] || { 
    icon: <LayersIcon width="12" height="12" />, 
    label: config.type, 
    color: 'gray' 
  };

  return (
    <SettingsContainer>
      <ScrollableContent>
        {/* エフェクト情報ヘッダー */}
        <CompactSection>
          <SectionHeader>
            <SectionIcon>{effectInfo.icon}</SectionIcon>
            <SectionTitle>{effectInfo.label}</SectionTitle>
            <CompactBadge color={effectInfo.color as any} size="1">
              {effectInfo.label}
            </CompactBadge>
          </SectionHeader>
          
          <Flex direction="column" gap="1">
            <CompactControlRow>
              <CompactLabel>表示</CompactLabel>
              <CompactValue>
                <Switch
                  checked={config.visible}
                  onCheckedChange={(checked) => handleConfigChange({ visible: checked })}
                  disabled={disabled}
                  size="1"
                />
                <Tooltip content={config.visible ? '表示中' : '非表示'}>
                  <IconButton variant="ghost" size="1">
                    {config.visible ? <EyeOpenIcon width="10" height="10" /> : <EyeClosedIcon width="10" height="10" />}
                  </IconButton>
                </Tooltip>
              </CompactValue>
            </CompactControlRow>
            
            <CompactControlRow>
              <CompactLabel>レイヤー</CompactLabel>
              <CompactValue>
                <CompactInput
                  type="number"
                  value={config.zIndex}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleConfigChange({ zIndex: parseInt(e.target.value, 10) })
                  }
                  min={0}
                  max={9999}
                  disabled={disabled}
                />
                <Tooltip content="高い値ほど前面に表示">
                  <Text size="1" color="gray">#</Text>
                </Tooltip>
              </CompactValue>
            </CompactControlRow>
          </Flex>
        </CompactSection>

        {/* 表示時間設定 - コンパクト版 */}
        <CompactSection>
          <SectionHeader>
            <SectionIcon><ClockIcon width="12" height="12" /></SectionIcon>
            <SectionTitle>時間</SectionTitle>
          </SectionHeader>
          
          <Flex direction="column" gap="1">
            <CompactControlRow>
              <CompactLabel>開始</CompactLabel>
              <CompactValue>
                <CompactInput
                  type="number"
                  value={config.startTime ?? 0}
                  onChange={(e) => handleTimeChange(parseFloat(e.target.value), config.endTime ?? duration ?? 0)}
                  min={0}
                  max={duration ?? 1000}
                  step={0.1}
                  disabled={disabled}
                />
                <Text size="1" color="gray">秒</Text>
              </CompactValue>
            </CompactControlRow>
            
            <CompactControlRow>
              <CompactLabel>終了</CompactLabel>
              <CompactValue>
                <CompactInput
                  type="number"
                  value={config.endTime ?? duration ?? 0}
                  onChange={(e) => handleTimeChange(config.startTime ?? 0, parseFloat(e.target.value))}
                  min={config.startTime ?? 0}
                  max={duration ?? 1000}
                  step={0.1}
                  disabled={disabled}
                />
                <Text size="1" color="gray">秒</Text>
              </CompactValue>
            </CompactControlRow>
          </Flex>
        </CompactSection>

        {/* エフェクト固有の設定 */}
        <CompactSection>
          <SectionHeader>
            <SectionIcon>{effectInfo.icon}</SectionIcon>
            <SectionTitle>詳細設定</SectionTitle>
          </SectionHeader>
          
          <div>
            {renderEffectSpecificSettings()}
          </div>
        </CompactSection>
      </ScrollableContent>
    </SettingsContainer>
  );
});

EffectSettings.displayName = 'EffectSettings'; 