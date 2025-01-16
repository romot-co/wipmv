import React from 'react';
import { EffectBase } from '../core/EffectBase';
import { EffectType } from '../core/types';
import { Card, Flex, Text, IconButton, Button, DropdownMenu } from '@radix-ui/themes';
import { 
  ChevronUpIcon, 
  ChevronDownIcon, 
  Cross2Icon, 
  BackpackIcon, 
  TextIcon, 
  ActivityLogIcon, 
  ImageIcon,
  PlusIcon
} from '@radix-ui/react-icons';
import './EffectList.css';

interface Props {
  effects: EffectBase[];
  selectedEffectId?: string;
  onEffectSelect: (id: string) => void;
  onEffectRemove: (id: string) => void;
  onEffectMove: (id: string, direction: 'up' | 'down') => void;
  onEffectAdd: (type: EffectType) => void;
}

// エフェクトタイプごとのアイコンとラベル
const effectTypeInfo = {
  [EffectType.Background]: { icon: BackpackIcon, label: '背景' },
  [EffectType.Text]: { icon: TextIcon, label: 'テキスト' },
  [EffectType.Waveform]: { icon: ActivityLogIcon, label: '波形' },
  [EffectType.Watermark]: { icon: ImageIcon, label: '透かし' },
};

export const EffectList: React.FC<Props> = ({
  effects,
  selectedEffectId,
  onEffectSelect,
  onEffectRemove,
  onEffectMove,
  onEffectAdd
}) => {
  // エフェクトリストをz-indexの降順でソート
  const sortedEffects = [...effects].sort((a, b) => 
    (b.getConfig().zIndex ?? 0) - (a.getConfig().zIndex ?? 0)
  );

  return (
    <Flex direction="column" gap="3" className="effect-list-container">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <Button size="2" variant="soft" className="add-effect-button">
            <PlusIcon />
            エフェクトを追加
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          {Object.entries(effectTypeInfo).map(([type, info]) => (
            <DropdownMenu.Item 
              key={type}
              onClick={() => onEffectAdd(type as EffectType)}
            >
              <Flex gap="2" align="center">
                <info.icon />
                {info.label}を追加
              </Flex>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      <Flex direction="column" gap="2" className="effect-list">
        {sortedEffects.map((effect, index) => {
          const config = effect.getConfig();
          const TypeIcon = effectTypeInfo[config.type].icon;
          const isSelected = config.id === selectedEffectId;

          return (
            <Card
              key={config.id}
              variant={isSelected ? 'classic' : 'surface'}
              className={`effect-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onEffectSelect(config.id)}
            >
              <Flex justify="between" align="center" gap="3">
                <Flex align="center" gap="2">
                  <TypeIcon />
                  <Text size="2">{effectTypeInfo[config.type].label}</Text>
                  <Text size="1" color="gray">
                    (z-index: {config.zIndex})
                  </Text>
                </Flex>
                <Flex gap="1">
                  <IconButton
                    size="1"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEffectMove(config.id, 'up');
                    }}
                    disabled={index === 0}
                  >
                    <ChevronUpIcon />
                  </IconButton>
                  <IconButton
                    size="1"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEffectMove(config.id, 'down');
                    }}
                    disabled={index === sortedEffects.length - 1}
                  >
                    <ChevronDownIcon />
                  </IconButton>
                  <IconButton
                    size="1"
                    variant="ghost"
                    color="red"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEffectRemove(config.id);
                    }}
                  >
                    <Cross2Icon />
                  </IconButton>
                </Flex>
              </Flex>
            </Card>
          );
        })}
      </Flex>
    </Flex>
  );
}; 