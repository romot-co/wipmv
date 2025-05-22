import React from 'react';
import { Flex, Text } from '@radix-ui/themes';
import { Position2D } from '../../core/types';

interface PositionPickerProps {
  label: string;
  value: Position2D;
  onChange: (position: Position2D) => void;
}

export const PositionPicker: React.FC<PositionPickerProps> = ({
  label,
  value,
  onChange
}) => {
  const handleXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const x = parseFloat(e.target.value);
    if (!isNaN(x)) {
      onChange({ ...value, x });
    }
  };

  const handleYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const y = parseFloat(e.target.value);
    if (!isNaN(y)) {
      onChange({ ...value, y });
    }
  };

  return (
    <Flex direction="column" gap="1">
      <Text as="label" size="2">{label}</Text>
      <Flex gap="2">
        <Flex direction="column" gap="1" style={{ flex: 1 }}>
          <Text as="label" size="1">X</Text>
          <input
            type="number"
            value={value.x}
            onChange={handleXChange}
            min={0}
            max={1}
            step={0.1}
            className="rt-TextFieldInput"
          />
        </Flex>
        <Flex direction="column" gap="1" style={{ flex: 1 }}>
          <Text as="label" size="1">Y</Text>
          <input
            type="number"
            value={value.y}
            onChange={handleYChange}
            min={0}
            max={1}
            step={0.1}
            className="rt-TextFieldInput"
          />
        </Flex>
      </Flex>
    </Flex>
  );
};
