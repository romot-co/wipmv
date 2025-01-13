import React from 'react';
import { EffectType } from '../core/types';
import { Flex, Button, Box, Text } from '@radix-ui/themes';
import { BackpackIcon, TextIcon, ActivityLogIcon, ImageIcon } from '@radix-ui/react-icons';

interface AddEffectButtonProps {
  onAdd: (type: EffectType) => void;
}

const effectButtons = [
  { 
    type: EffectType.Background, 
    icon: BackpackIcon, 
    label: '背景',
    description: '背景色や画像を設定'
  },
  { 
    type: EffectType.Text, 
    icon: TextIcon, 
    label: 'テキスト',
    description: 'テキストを追加'
  },
  { 
    type: EffectType.Waveform, 
    icon: ActivityLogIcon, 
    label: '波形',
    description: '音声の波形を表示'
  },
  { 
    type: EffectType.Watermark, 
    icon: ImageIcon, 
    label: 'ウォーターマーク',
    description: '画像を重ねて表示'
  }
];

export const AddEffectButton: React.FC<AddEffectButtonProps> = ({ onAdd }) => {
  return (
    <Box>
      <Text size="2" weight="medium" mb="2">
        エフェクトを追加
      </Text>
      <Flex gap="2" wrap="wrap">
        {effectButtons.map(({ type, icon: Icon, label, description }) => (
          <Button 
            key={type}
            variant="surface" 
            onClick={() => onAdd(type)}
            size="2"
            color="gray"
            className="hover-highlight fade-in"
          >
            <Flex gap="2" align="center">
              <Icon width="16" height="16" />
              <Box>
                <Text size="2" weight="medium">{label}</Text>
                <Text size="1" color="gray">{description}</Text>
              </Box>
            </Flex>
          </Button>
        ))}
      </Flex>
    </Box>
  );
}; 