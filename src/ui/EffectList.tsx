import React from 'react';
import { Flex, Text, IconButton, Tooltip, Badge } from '@radix-ui/themes';
import { EyeOpenIcon, EyeClosedIcon, TrashIcon, DragHandleDots2Icon } from '@radix-ui/react-icons';
import type { EffectConfig } from '../core/types/effect';
import styled from 'styled-components';

const ListContainer = styled.div`
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 12px;
`;

const ListTitle = styled.h4`
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0 0 8px 0;
  padding: 0 4px;
`;

const EffectItem = styled.div<{ 
  isSelected: boolean; 
  isDragging: boolean; 
  isDragOver: boolean; 
}>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  border-radius: 6px;
  margin-bottom: 4px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  background-color: ${props => {
    if (props.isDragging) return 'var(--primary-color)40';
    if (props.isDragOver) return 'var(--primary-color)20';
    if (props.isSelected) return 'var(--primary-color)';
    return 'transparent';
  }};
  border: 2px solid ${props => {
    if (props.isDragOver) return 'var(--primary-color)';
    if (props.isSelected) return 'var(--primary-color)';
    return 'transparent';
  }};
  opacity: ${props => props.isDragging ? 0.5 : 1};
  transform: ${props => props.isDragging ? 'scale(0.98)' : 'scale(1)'};
  
  &:hover {
    background-color: ${props => {
      if (props.isDragging) return 'var(--primary-color)40';
      if (props.isSelected) return 'var(--primary-hover)';
      return 'var(--bg-hover)';
    }};
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DragHandle = styled.div<{ isSelected: boolean }>`
  cursor: grab;
  display: flex;
  align-items: center;
  padding: 2px;
  border-radius: 3px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.isSelected ? 'rgba(255,255,255,0.1)' : 'var(--bg-hover)'};
  }
  
  &:active {
    cursor: grabbing;
  }
`;

const EffectInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
`;

const EffectName = styled.span<{ isSelected: boolean }>`
  font-size: 13px;
  font-weight: 500;
  color: ${props => props.isSelected ? 'white' : 'var(--text-primary)'};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const EffectType = styled.span<{ isSelected: boolean }>`
  font-size: 11px;
  color: ${props => props.isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)'};
`;

const EffectActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0.7;
  
  &:hover {
    opacity: 1;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 16px 8px;
  color: var(--text-secondary);
  font-size: 12px;
`;

interface EffectListProps {
  effects: EffectConfig[];
  selectedEffectId: string | null;
  onSelectEffect: (id: string) => void;
  onDeleteEffect: (id: string) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
  onMoveEffect?: (sourceId: string, targetId: string) => void;
}

// エフェクトタイプの日本語名マッピング
const effectTypeNames: Record<string, string> = {
  background: '背景',
  text: 'テキスト', 
  waveform: '波形',
  watermark: '透かし'
};

export const EffectList: React.FC<EffectListProps> = ({
  effects,
  selectedEffectId,
  onSelectEffect,
  onDeleteEffect,
  onToggleVisibility,
  onMoveEffect
}) => {
  const [dragState, setDragState] = React.useState<{
    draggedId: string | null;
    dragOverId: string | null;
  }>({
    draggedId: null,
    dragOverId: null
  });

  if (effects.length === 0) {
    return (
      <ListContainer>
        <ListTitle>エフェクト</ListTitle>
        <EmptyState>
          エフェクトがありません<br />
          上のツールバーから追加してください
        </EmptyState>
      </ListContainer>
    );
  }

  // エフェクトをzIndexの降順でソート（前景が上、背景が下）
  const sortedEffects = [...effects].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));

  const handleDragStart = (e: React.DragEvent, effectId: string) => {
    setDragState(prev => ({ ...prev, draggedId: effectId }));
    e.dataTransfer.setData('text/plain', effectId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDragState({ draggedId: null, dragOverId: null });
  };

  const handleDragOver = (e: React.DragEvent, effectId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragState(prev => ({ ...prev, dragOverId: effectId }));
  };

  const handleDragLeave = () => {
    setDragState(prev => ({ ...prev, dragOverId: null }));
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    
    if (sourceId && sourceId !== targetId && onMoveEffect) {
      onMoveEffect(sourceId, targetId);
    }
    
    setDragState({ draggedId: null, dragOverId: null });
  };

  return (
    <ListContainer>
      <ListTitle>エフェクト ({effects.length})</ListTitle>
      <div>
        {sortedEffects.map((effect) => {
          const isSelected = effect.id === selectedEffectId;
          const isDragging = dragState.draggedId === effect.id;
          const isDragOver = dragState.dragOverId === effect.id;
          const typeName = effectTypeNames[effect.type] || effect.type;
          
          return (
            <EffectItem
              key={effect.id}
              isSelected={isSelected}
              isDragging={isDragging}
              isDragOver={isDragOver}
              draggable
              onDragStart={(e) => handleDragStart(e, effect.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, effect.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, effect.id)}
              onClick={() => !isDragging && onSelectEffect(effect.id)}
            >
              <EffectInfo>
                <DragHandle 
                  isSelected={isSelected}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <DragHandleDots2Icon width="12" height="12" style={{ 
                    color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' 
                  }} />
                </DragHandle>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <EffectName isSelected={isSelected}>
                    {typeName}
                    {effect.type === 'text' && effect.text && ` (${effect.text.slice(0, 10)}${effect.text.length > 10 ? '...' : ''})`}
                  </EffectName>
                  <br />
                  <EffectType isSelected={isSelected}>
                    {effect.startTime?.toFixed(1)}s - {effect.endTime ? `${effect.endTime.toFixed(1)}s` : '終了まで'}
                  </EffectType>
                </div>
                {!effect.visible && (
                  <Badge color="gray" size="1">非表示</Badge>
                )}
              </EffectInfo>
              
              <EffectActions onClick={(e) => e.stopPropagation()}>
                <Tooltip content={effect.visible ? '非表示にする' : '表示する'}>
                  <IconButton
                    variant="ghost"
                    size="1"
                    onClick={() => onToggleVisibility(effect.id, !effect.visible)}
                    style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)' }}
                  >
                    {effect.visible ? <EyeOpenIcon width="12" height="12" /> : <EyeClosedIcon width="12" height="12" />}
                  </IconButton>
                </Tooltip>
                
                <Tooltip content="削除">
                  <IconButton
                    variant="ghost"
                    size="1"
                    onClick={() => onDeleteEffect(effect.id)}
                    style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)' }}
                  >
                    <TrashIcon width="12" height="12" />
                  </IconButton>
                </Tooltip>
              </EffectActions>
            </EffectItem>
          );
        })}
      </div>
    </ListContainer>
  );
<<<<<<< HEAD
}; 
=======
});

EffectList.displayName = 'EffectList';
>>>>>>> 4b34a4e5aa778551329353847f0a002c35789a9f
