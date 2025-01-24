import React from 'react';
import { WaveformEffectConfig } from '../../../core/types';
import { Flex, Box, Text, Select, Slider, Switch } from '@radix-ui/themes';
import { CoordinateSystemSettings } from '../../common/CoordinateSystemSettings';
import '../../EffectSettings.css';

interface WaveformSettingsProps {
  config: WaveformEffectConfig;
  onChange: (newConfig: Partial<WaveformEffectConfig>) => void;
}

const defaultMirror = { vertical: false, horizontal: false };
const defaultColorBands = {
  ranges: [
    { min: 0, max: 0.2, color: '#ff0000' },
    { min: 0.2, max: 0.5, color: '#ffff00' },
    { min: 0.5, max: 1.0, color: '#00ff00' }
  ]
};
const defaultPosition = { x: 0, y: 0 };
const defaultSize = { width: 100, height: 100 };

export const WaveformSettings: React.FC<WaveformSettingsProps> = ({
  config,
  onChange
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
        />

        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            表示モード
          </Text>
          <Select.Root
            value={config.displayMode || 'waveform'}
            onValueChange={(value) => onChange({ displayMode: value as 'waveform' | 'frequency' })}
          >
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="waveform">波形</Select.Item>
              <Select.Item value="frequency">周波数</Select.Item>
            </Select.Content>
          </Select.Root>
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            チャンネルモード
          </Text>
          <Select.Root
            value={config.channelMode || 'mono'}
            onValueChange={(value) => onChange({ channelMode: value as 'mono' | 'stereo' | 'leftOnly' | 'rightOnly' })}
          >
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="mono">モノラル</Select.Item>
              <Select.Item value="stereo">ステレオ</Select.Item>
              <Select.Item value="leftOnly">左チャンネルのみ</Select.Item>
              <Select.Item value="rightOnly">右チャンネルのみ</Select.Item>
            </Select.Content>
          </Select.Root>
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            波形タイプ
          </Text>
          <Select.Root
            value={config.waveformType || 'bar'}
            onValueChange={(value) => onChange({ waveformType: value as 'bar' | 'line' | 'circle' })}
          >
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="bar">バー</Select.Item>
              <Select.Item value="line">ライン</Select.Item>
              <Select.Item value="circle">サークル</Select.Item>
            </Select.Content>
          </Select.Root>
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            ミラー
          </Text>
          <Flex direction="column" gap="2">
            <Flex gap="3" align="center">
              <Text size="2" weight="medium">垂直</Text>
              <Switch
                checked={config.mirror.vertical}
                onCheckedChange={(checked) => onChange({
                  mirror: {
                    ...config.mirror,
                    vertical: checked
                  }
                })}
              />
            </Flex>
            <Flex gap="3" align="center">
              <Text size="2" weight="medium">水平</Text>
              <Switch
                checked={config.mirror.horizontal}
                onCheckedChange={(checked) => onChange({
                  mirror: {
                    ...config.mirror,
                    horizontal: checked
                  }
                })}
              />
            </Flex>
          </Flex>
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            カラーバンド
          </Text>
          <Flex direction="column" gap="2">
            <Switch
              checked={config.useColorBands}
              onCheckedChange={(checked) => {
                onChange({
                  useColorBands: checked,
                  colorBands: checked ? defaultColorBands : undefined
                });
              }}
            />
            {config.useColorBands && config.colorBands && (
              <>
                {config.colorBands.ranges.map((band, index) => (
                  <Flex key={index} gap="3" align="center">
                    <input
                      type="color"
                      value={band.color}
                      onChange={(e) => {
                        const newRanges = [...config.colorBands!.ranges];
                        newRanges[index] = { ...band, color: e.target.value };
                        onChange({ colorBands: { ranges: newRanges } });
                      }}
                      className="color-picker"
                    />
                    <Flex gap="2">
                      <input
                        type="number"
                        value={band.min}
                        onChange={(e) => {
                          const newRanges = [...config.colorBands!.ranges];
                          newRanges[index] = { ...band, min: Number(e.target.value) };
                          onChange({ colorBands: { ranges: newRanges } });
                        }}
                        min={0}
                        max={1}
                        step={0.1}
                        className="number-input"
                      />
                      <input
                        type="number"
                        value={band.max}
                        onChange={(e) => {
                          const newRanges = [...config.colorBands!.ranges];
                          newRanges[index] = { ...band, max: Number(e.target.value) };
                          onChange({ colorBands: { ranges: newRanges } });
                        }}
                        min={0}
                        max={1}
                        step={0.1}
                        className="number-input"
                      />
                    </Flex>
                    <button
                      onClick={() => {
                        const newRanges = [...config.colorBands!.ranges];
                        newRanges.splice(index, 1);
                        onChange({ colorBands: { ranges: newRanges } });
                      }}
                    >
                      削除
                    </button>
                  </Flex>
                ))}
                <button
                  onClick={() => {
                    const newRanges = [...config.colorBands!.ranges, { min: 0, max: 1, color: '#ffffff' }];
                    onChange({ colorBands: { ranges: newRanges } });
                  }}
                >
                  バンドを追加
                </button>
              </>
            )}
          </Flex>
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            時間範囲
          </Text>
          <Flex direction="column" gap="2">
            <Flex gap="3" align="center">
              <Text size="2" weight="medium">開始時間 (秒)</Text>
              <input
                type="number"
                value={config.startTime}
                onChange={(e) => onChange({ startTime: Number(e.target.value) })}
                min={0}
                step={0.1}
                className="number-input"
              />
            </Flex>
            <Flex gap="3" align="center">
              <Text size="2" weight="medium">終了時間 (秒)</Text>
              <input
                type="number"
                value={config.endTime}
                onChange={(e) => onChange({ endTime: Number(e.target.value) })}
                min={0}
                step={0.1}
                className="number-input"
              />
            </Flex>
          </Flex>
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            バーの幅
          </Text>
          <Flex gap="3" align="center">
            <Slider
              value={[config.barWidth]}
              min={1}
              max={50}
              step={1}
              onValueChange={(value) => onChange({ barWidth: value[0] })}
            />
            <Text size="2">{config.barWidth}px</Text>
          </Flex>
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            バーの間隔
          </Text>
          <Flex gap="3" align="center">
            <Slider
              value={[config.barGap]}
              min={0}
              max={20}
              step={1}
              onValueChange={(value) => onChange({ barGap: value[0] })}
            />
            <Text size="2">{config.barGap}px</Text>
          </Flex>
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            感度
          </Text>
          <Flex gap="3" align="center">
            <Slider
              value={[config.sensitivity]}
              min={0.1}
              max={5}
              step={0.1}
              onValueChange={(value) => onChange({ sensitivity: value[0] })}
            />
            <Text size="2">{config.sensitivity}</Text>
          </Flex>
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="2">
            波形の色
          </Text>
          <Flex gap="3" align="center">
            <input
              type="color"
              value={config.color}
              onChange={(e) => onChange({ color: e.target.value })}
              className="color-picker"
            />
            <input
              type="text"
              value={config.color}
              onChange={(e) => onChange({ color: e.target.value })}
              pattern="^#[0-9A-Fa-f]{6}$"
              className="color-input"
            />
          </Flex>
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