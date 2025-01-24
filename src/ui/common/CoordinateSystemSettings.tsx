import React, { memo } from 'react';
import { CoordinateSystem, Position, Size } from '../../core/types/base';
import { Flex, Box, Text, Select } from '@radix-ui/themes';

/**
 * 座標系設定のプロパティ
 */
interface CoordinateSystemSettingsProps {
  coordinateSystem: CoordinateSystem;
  position: Position;
  size: Size;
  onCoordinateSystemChange: (value: CoordinateSystem) => void;
  onPositionChange: (position: Position) => void;
  onSizeChange: (size: Size) => void;
  disabled?: boolean;
}

/**
 * 座標系設定コンポーネント
 * - 座標系の選択（相対値/絶対値）
 * - 位置の設定（X座標/Y座標）
 * - サイズの設定（幅/高さ）
 */
export const CoordinateSystemSettings = memo<CoordinateSystemSettingsProps>(({
  coordinateSystem,
  position,
  size,
  onCoordinateSystemChange,
  onPositionChange,
  onSizeChange,
  disabled = false
}) => {
  return (
    <>
      <Box>
        <Text as="label" size="2" weight="bold" mb="2">
          座標系
        </Text>
        <Select.Root
          value={coordinateSystem}
          onValueChange={(value) => onCoordinateSystemChange(value as CoordinateSystem)}
          disabled={disabled}
        >
          <Select.Trigger />
          <Select.Content>
            <Select.Item value="relative">相対値</Select.Item>
            <Select.Item value="absolute">絶対値</Select.Item>
          </Select.Content>
        </Select.Root>
      </Box>

      <Box>
        <Text as="label" size="2" weight="bold" mb="2">
          位置
        </Text>
        <Flex direction="column" gap="2">
          <Flex gap="3" align="center">
            <Text size="2" weight="medium">X座標 {coordinateSystem === 'relative' ? '(%)' : '(px)'}</Text>
            <input
              type="number"
              value={position.x}
              onChange={(e) => onPositionChange({
                ...position,
                x: Number(e.target.value)
              })}
              min={coordinateSystem === 'relative' ? 0 : undefined}
              max={coordinateSystem === 'relative' ? 100 : undefined}
              step={coordinateSystem === 'relative' ? 1 : 1}
              className="number-input"
              disabled={disabled}
            />
          </Flex>
          <Flex gap="3" align="center">
            <Text size="2" weight="medium">Y座標 {coordinateSystem === 'relative' ? '(%)' : '(px)'}</Text>
            <input
              type="number"
              value={position.y}
              onChange={(e) => onPositionChange({
                ...position,
                y: Number(e.target.value)
              })}
              min={coordinateSystem === 'relative' ? 0 : undefined}
              max={coordinateSystem === 'relative' ? 100 : undefined}
              step={coordinateSystem === 'relative' ? 1 : 1}
              className="number-input"
              disabled={disabled}
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
            <Text size="2" weight="medium">幅 {coordinateSystem === 'relative' ? '(%)' : '(px)'}</Text>
            <input
              type="number"
              value={size.width}
              onChange={(e) => onSizeChange({
                ...size,
                width: Number(e.target.value)
              })}
              min={coordinateSystem === 'relative' ? 0 : undefined}
              max={coordinateSystem === 'relative' ? 100 : undefined}
              step={coordinateSystem === 'relative' ? 1 : 1}
              className="number-input"
              disabled={disabled}
            />
          </Flex>
          <Flex gap="3" align="center">
            <Text size="2" weight="medium">高さ {coordinateSystem === 'relative' ? '(%)' : '(px)'}</Text>
            <input
              type="number"
              value={size.height}
              onChange={(e) => onSizeChange({
                ...size,
                height: Number(e.target.value)
              })}
              min={coordinateSystem === 'relative' ? 0 : undefined}
              max={coordinateSystem === 'relative' ? 100 : undefined}
              step={coordinateSystem === 'relative' ? 1 : 1}
              className="number-input"
              disabled={disabled}
            />
          </Flex>
        </Flex>
      </Box>
    </>
  );
});

CoordinateSystemSettings.displayName = 'CoordinateSystemSettings'; 