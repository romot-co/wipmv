import React, { useState } from 'react';
import { Dialog, Flex, Text, Select, TextField, RadioCards, Badge, Separator, Button, Switch } from '@radix-ui/themes';
import styled from 'styled-components';
import type { VideoSettings } from '../core/types/base';

const SettingsContainer = styled.div`
  padding: 20px;
  max-width: 600px;
  min-height: 500px;
`;

const SettingSection = styled.div`
  margin-bottom: 20px;
  padding: 16px;
  background-color: var(--gray-2);
  border-radius: 8px;
  border: 1px solid var(--gray-6);
`;

const SectionTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-12);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SettingLabel = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: var(--gray-11);
  min-width: 120px;
`;

const ResolutionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NumberInput = styled.input`
  width: 80px;
  padding: 6px 8px;
  border: 1px solid var(--gray-7);
  border-radius: 4px;
  font-size: 12px;
  background-color: var(--gray-1);
  color: var(--gray-12);
  
  &:focus {
    outline: none;
    border-color: var(--accent-9);
    box-shadow: 0 0 0 2px var(--accent-a4);
  }
`;

const PresetButton = styled.button<{ active: boolean }>`
  padding: 6px 12px;
  border: 1px solid ${props => props.active ? 'var(--accent-9)' : 'var(--gray-7)'};
  border-radius: 4px;
  background-color: ${props => props.active ? 'var(--accent-9)' : 'var(--gray-3)'};
  color: ${props => props.active ? 'white' : 'var(--gray-11)'};
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.active ? 'var(--accent-10)' : 'var(--gray-4)'};
  }
`;

const PresetGroup = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

export interface EncodeSettingsProps {
  settings: VideoSettings;
  onSettingsChange: (settings: VideoSettings) => void;
  onExport: () => void;
  onCancel: () => void;
}

export const EncodeSettings: React.FC<EncodeSettingsProps> = ({
  settings,
  onSettingsChange,
  onExport,
  onCancel,
}) => {
  const [currentSettings, setCurrentSettings] = useState<VideoSettings>(settings);

  const updateSetting = <K extends keyof VideoSettings>(
    key: K,
    value: VideoSettings[K]
  ) => {
    const newSettings = { ...currentSettings, [key]: value };
    setCurrentSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const updateCodec = (type: 'video' | 'audio', codec: string) => {
    const newCodec = { ...currentSettings.codec, [type]: codec };
    updateSetting('codec', newCodec);
  };

  const setResolutionPreset = (width: number, height: number) => {
    setCurrentSettings(prev => ({
      ...prev,
      width,
      height
    }));
    onSettingsChange({
      ...currentSettings,
      width,
      height
    });
  };

  const setBitratePreset = (quality: 'low' | 'medium' | 'high' | 'ultra') => {
    const presets = {
      low: { videoBitrate: 2000000, audioBitrate: 128000 },
      medium: { videoBitrate: 5000000, audioBitrate: 192000 },
      high: { videoBitrate: 10000000, audioBitrate: 256000 },
      ultra: { videoBitrate: 20000000, audioBitrate: 320000 }
    };
    const preset = presets[quality];
    setCurrentSettings(prev => ({
      ...prev,
      ...preset
    }));
    onSettingsChange({
      ...currentSettings,
      ...preset
    });
  };

  const getQualityLevel = () => {
    const { videoBitrate } = currentSettings;
    if (videoBitrate <= 3000000) return 'low';
    if (videoBitrate <= 7000000) return 'medium';
    if (videoBitrate <= 15000000) return 'high';
    return 'ultra';
  };

  const getResolutionPreset = () => {
    const { width, height } = currentSettings;
    if (width === 1280 && height === 720) return '720p';
    if (width === 1920 && height === 1080) return '1080p';
    if (width === 2560 && height === 1440) return '1440p';
    if (width === 3840 && height === 2160) return '4K';
    return 'custom';
  };

  return (
    <SettingsContainer>
      <Text size="4" weight="bold" style={{ marginBottom: '20px', display: 'block' }}>
        エクスポート設定
      </Text>

      {/* 基本設定 */}
      <SettingSection>
        <SectionTitle>
          📹 基本設定
        </SectionTitle>
        
        <SettingRow>
          <SettingLabel>解像度</SettingLabel>
          <div>
            <ResolutionGroup>
              <NumberInput
                type="number"
                value={currentSettings.width}
                onChange={(e) => updateSetting('width', parseInt(e.target.value) || 1920)}
                min={480}
                max={7680}
                step={2}
              />
              <Text size="1">×</Text>
              <NumberInput
                type="number"
                value={currentSettings.height}
                onChange={(e) => updateSetting('height', parseInt(e.target.value) || 1080)}
                min={360}
                max={4320}
                step={2}
              />
            </ResolutionGroup>
            <PresetGroup style={{ marginTop: '8px' }}>
              <PresetButton
                active={getResolutionPreset() === '720p'}
                onClick={() => setResolutionPreset(1280, 720)}
              >
                720p
              </PresetButton>
              <PresetButton
                active={getResolutionPreset() === '1080p'}
                onClick={() => setResolutionPreset(1920, 1080)}
              >
                1080p
              </PresetButton>
              <PresetButton
                active={getResolutionPreset() === '1440p'}
                onClick={() => setResolutionPreset(2560, 1440)}
              >
                1440p
              </PresetButton>
              <PresetButton
                active={getResolutionPreset() === '4K'}
                onClick={() => setResolutionPreset(3840, 2160)}
              >
                4K
              </PresetButton>
            </PresetGroup>
          </div>
        </SettingRow>

        <SettingRow>
          <SettingLabel>フレームレート</SettingLabel>
          <Select.Root
            value={currentSettings.frameRate.toString()}
            onValueChange={(value) => updateSetting('frameRate', parseInt(value))}
          >
            <Select.Trigger style={{ width: '120px' }} />
            <Select.Content>
              <Select.Item value="24">24 fps (映画)</Select.Item>
              <Select.Item value="30">30 fps (標準)</Select.Item>
              <Select.Item value="60">60 fps (高品質)</Select.Item>
              <Select.Item value="120">120 fps (超高品質)</Select.Item>
            </Select.Content>
          </Select.Root>
        </SettingRow>
      </SettingSection>

      {/* コーデック設定 */}
      <SettingSection>
        <SectionTitle>
          🔧 コーデック設定
        </SectionTitle>

        <SettingRow>
          <SettingLabel>コンテナ</SettingLabel>
          <Select.Root
            value={currentSettings.container || 'mp4'}
            onValueChange={(value: 'mp4' | 'webm') => updateSetting('container', value)}
          >
            <Select.Trigger style={{ width: '120px' }} />
            <Select.Content>
              <Select.Item value="mp4">MP4</Select.Item>
              <Select.Item value="webm">WebM</Select.Item>
            </Select.Content>
          </Select.Root>
        </SettingRow>

        <SettingRow>
          <SettingLabel>映像コーデック</SettingLabel>
          <Select.Root
            value={currentSettings.codec?.video || 'avc'}
            onValueChange={(value) => updateCodec('video', value)}
          >
            <Select.Trigger style={{ width: '120px' }} />
            <Select.Content>
              <Select.Item value="avc">H.264 (AVC)</Select.Item>
              <Select.Item value="hevc">H.265 (HEVC)</Select.Item>
              <Select.Item value="vp8">VP8</Select.Item>
              <Select.Item value="vp9">VP9</Select.Item>
              <Select.Item value="av1">AV1</Select.Item>
            </Select.Content>
          </Select.Root>
        </SettingRow>

        <SettingRow>
          <SettingLabel>音声コーデック</SettingLabel>
          <Select.Root
            value={currentSettings.codec?.audio || 'aac'}
            onValueChange={(value) => updateCodec('audio', value)}
          >
            <Select.Trigger style={{ width: '120px' }} />
            <Select.Content>
              <Select.Item value="aac">AAC</Select.Item>
              <Select.Item value="opus">Opus</Select.Item>
            </Select.Content>
          </Select.Root>
        </SettingRow>
      </SettingSection>

      {/* 品質設定 */}
      <SettingSection>
        <SectionTitle>
          ⚡ 品質設定
        </SectionTitle>

        <SettingRow>
          <SettingLabel>品質プリセット</SettingLabel>
          <PresetGroup>
            <PresetButton
              active={getQualityLevel() === 'low'}
              onClick={() => setBitratePreset('low')}
            >
              低品質
            </PresetButton>
            <PresetButton
              active={getQualityLevel() === 'medium'}
              onClick={() => setBitratePreset('medium')}
            >
              標準
            </PresetButton>
            <PresetButton
              active={getQualityLevel() === 'high'}
              onClick={() => setBitratePreset('high')}
            >
              高品質
            </PresetButton>
            <PresetButton
              active={getQualityLevel() === 'ultra'}
              onClick={() => setBitratePreset('ultra')}
            >
              最高品質
            </PresetButton>
          </PresetGroup>
        </SettingRow>

        <SettingRow>
          <SettingLabel>映像ビットレート</SettingLabel>
          <div>
            <NumberInput
              type="number"
              value={Math.round(currentSettings.videoBitrate / 1000000 * 10) / 10}
              onChange={(e) => updateSetting('videoBitrate', parseFloat(e.target.value) * 1000000)}
              min={0.5}
              max={100}
              step={0.5}
            />
            <Text size="1" style={{ marginLeft: '6px' }}>Mbps</Text>
          </div>
        </SettingRow>

        <SettingRow>
          <SettingLabel>音声ビットレート</SettingLabel>
          <div>
            <NumberInput
              type="number"
              value={currentSettings.audioBitrate / 1000}
              onChange={(e) => updateSetting('audioBitrate', parseInt(e.target.value) * 1000)}
              min={64}
              max={512}
              step={32}
            />
            <Text size="1" style={{ marginLeft: '6px' }}>kbps</Text>
          </div>
        </SettingRow>
      </SettingSection>

      {/* 高度な設定 */}
      <SettingSection>
        <SectionTitle>
          🛠️ 高度な設定
        </SectionTitle>

        <SettingRow>
          <SettingLabel>レイテンシモード</SettingLabel>
          <Select.Root
            value={currentSettings.latencyMode || 'quality'}
            onValueChange={(value: 'quality' | 'realtime') => updateSetting('latencyMode', value)}
          >
            <Select.Trigger style={{ width: '120px' }} />
            <Select.Content>
              <Select.Item value="quality">品質優先</Select.Item>
              <Select.Item value="realtime">リアルタイム</Select.Item>
            </Select.Content>
          </Select.Root>
        </SettingRow>

        <SettingRow>
          <SettingLabel>ハードウェア加速</SettingLabel>
          <Select.Root
            value={currentSettings.hardwareAcceleration || 'no-preference'}
            onValueChange={(value: any) => updateSetting('hardwareAcceleration', value)}
          >
            <Select.Trigger style={{ width: '120px' }} />
            <Select.Content>
              <Select.Item value="no-preference">自動</Select.Item>
              <Select.Item value="prefer-hardware">HW優先</Select.Item>
              <Select.Item value="prefer-software">SW優先</Select.Item>
            </Select.Content>
          </Select.Root>
        </SettingRow>

        <SettingRow>
          <SettingLabel>サンプルレート</SettingLabel>
          <Select.Root
            value={(currentSettings.sampleRate || 48000).toString()}
            onValueChange={(value) => updateSetting('sampleRate', parseInt(value))}
          >
            <Select.Trigger style={{ width: '120px' }} />
            <Select.Content>
              <Select.Item value="44100">44.1 kHz</Select.Item>
              <Select.Item value="48000">48 kHz</Select.Item>
              <Select.Item value="96000">96 kHz</Select.Item>
            </Select.Content>
          </Select.Root>
        </SettingRow>

        <SettingRow>
          <SettingLabel>チャンネル数</SettingLabel>
          <Select.Root
            value={(currentSettings.channels || 2).toString()}
            onValueChange={(value) => updateSetting('channels', parseInt(value))}
          >
            <Select.Trigger style={{ width: '120px' }} />
            <Select.Content>
              <Select.Item value="1">モノラル</Select.Item>
              <Select.Item value="2">ステレオ</Select.Item>
              <Select.Item value="6">5.1ch</Select.Item>
            </Select.Content>
          </Select.Root>
        </SettingRow>
      </SettingSection>

      <Separator style={{ margin: '20px 0' }} />

      <Flex justify="end" gap="3">
        <Button variant="soft" onClick={onCancel}>
          キャンセル
        </Button>
        <Button onClick={onExport}>
          エクスポート開始
        </Button>
      </Flex>
    </SettingsContainer>
  );
}; 