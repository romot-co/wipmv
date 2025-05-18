import React, { memo, useState } from 'react';
import { Card, Flex, Text, IconButton, Button, DropdownMenu } from '@radix-ui/themes';
import { 
  ChevronUpIcon, 
  ChevronDownIcon, 
  Cross2Icon, 
  BackpackIcon, 
  TextIcon, 
  ActivityLogIcon, 
  ImageIcon,
  PlusIcon,
  DragHandleDots2Icon
} from '@radix-ui/react-icons';
import { EffectBase, EffectConfig } from '../core/types/core';
import { EffectType } from '../core/types/effect';
import { AppError, ErrorType } from '../core/types/error';
import './EffectList.css';

/**
 * エフェクトリストのプロパティ
 */
interface EffectListProps {
  effects: EffectBase<EffectConfig>[];
  selectedEffectId: string | null;
  onEffectSelect: (id: string) => void;
  onEffectRemove: (id: string) => void;
  onEffectMove: (sourceId: string, targetId: string) => void;
  onEffectAdd: (type: EffectType) => void;
  onError?: (error: AppError) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

// エフェクトタイプごとのアイコンとラベル
const effectTypeInfo: {
  [K in 'background' | 'text' | 'waveform' | 'watermark']: { 
    icon: React.FC; 
    label: string;
  }
} = {
  'background': { icon: BackpackIcon, label: '背景' },
  'text': { icon: TextIcon, label: 'テキスト' },
  'waveform': { icon: ActivityLogIcon, label: '波形' },
  'watermark': { icon: ImageIcon, label: '透かし' }
};

/**
 * エフェクトリストコンポーネント
 * - エフェクトの一覧表示
 * - エフェクトの追加・削除・移動
 * - ドラッグ&ドロップによる並び替え
 */
export const EffectList = memo<EffectListProps>(({
  effects,
  selectedEffectId,
  onEffectSelect,
  onEffectRemove,
  onEffectMove,
  onEffectAdd,
  onError,
  isLoading = false,
  disabled = false
}) => {
  // エフェクトリストをz-indexの降順でソート
  const sortedEffects = [...effects].sort((a, b) => 
    (b.getConfig().zIndex ?? 0) - (a.getConfig().zIndex ?? 0)
  );

  // ドラッグ&ドロップの状態管理
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    try {
      e.dataTransfer.setData('text/plain', id);
      setDraggedId(id);
    } catch (error) {
      onError?.(new AppError(
        ErrorType.EffectError,
        'エフェクトのドラッグ開始に失敗しました'
      ));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    try {
      e.preventDefault();
      const sourceId = e.dataTransfer.getData('text/plain');
      if (sourceId !== targetId) {
        onEffectMove(sourceId, targetId);
      }
      setDraggedId(null);
    } catch (error) {
      onError?.(new AppError(
        ErrorType.EffectError,
        'エフェクトの移動に失敗しました'
      ));
    }
  };

  return (
    <Flex direction="column" gap="3" className="effect-list-container">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <Button 
            size="2" 
            variant="soft" 
            className="add-effect-button"
            disabled={isLoading || disabled}
          >
            <PlusIcon />
            エフェクトを追加
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          {Object.entries(effectTypeInfo).map(([type, info]) => (
            <DropdownMenu.Item 
              key={type}
              onClick={() => onEffectAdd(type as EffectType)}
              disabled={isLoading || disabled}
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
        {sortedEffects.map(effect => {
          const config = effect.getConfig();
          const TypeIcon = effectTypeInfo[config.type].icon;
          const isSelected = config.id === selectedEffectId;
          const isDragging = config.id === draggedId;

          return (
            <Card
              key={config.id}
              variant={isSelected ? 'classic' : 'surface'}
              className={`effect-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
              onClick={() => onEffectSelect(config.id)}
              draggable={!disabled}
              onDragStart={(e) => handleDragStart(e, config.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, config.id)}
            >
              <Flex justify="between" align="center" gap="3">
                <Flex align="center" gap="2">
                  <DragHandleDots2Icon className="drag-handle" />
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
                      const prevEffect = sortedEffects[effects.indexOf(effect) - 1];
                      if (prevEffect) {
                        onEffectMove(config.id, prevEffect.getConfig().id);
                      }
                    }}
                    disabled={isLoading || disabled || effects.indexOf(effect) === 0}
                  >
                    <ChevronUpIcon />
                  </IconButton>
                  <IconButton
                    size="1"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextEffect = sortedEffects[effects.indexOf(effect) + 1];
                      if (nextEffect) {
                        onEffectMove(config.id, nextEffect.getConfig().id);
                      }
                    }}
                    disabled={isLoading || disabled || effects.indexOf(effect) === effects.length - 1}
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
                    disabled={isLoading || disabled}
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
});

EffectList.displayName = 'EffectList';
