import React from 'react';
import { Flex, IconButton, Tooltip } from '@radix-ui/themes';
import { PlusIcon, ImageIcon, TextIcon, SpeakerLoudIcon, StarIcon } from '@radix-ui/react-icons';
import { EffectType } from '../core/types/effect';
import styled from 'styled-components';

const ToolbarContainer = styled.div`
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 12px;
`;

const ToolbarTitle = styled.h4`
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0 0 8px 0;
  padding: 0 4px;
`;

interface EffectToolbarProps {
  onAddEffect: (type: EffectType) => void;
}

export const EffectToolbar: React.FC<EffectToolbarProps> = ({ onAddEffect }) => {
  return (
    <ToolbarContainer>
      <ToolbarTitle>エフェクトを追加</ToolbarTitle>
      <Flex gap="2" justify="start" align="center">
        <Tooltip content="背景を追加">
          <IconButton
            variant="ghost"
            size="2"
            onClick={() => onAddEffect('background')}
          >
            <ImageIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip content="テキストを追加">
          <IconButton
            variant="ghost"
            size="2"
            onClick={() => onAddEffect('text')}
          >
            <TextIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip content="波形を追加">
          <IconButton
            variant="ghost"
            size="2"
            onClick={() => onAddEffect('waveform')}
          >
            <SpeakerLoudIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip content="透かしを追加">
          <IconButton
            variant="ghost"
            size="2"
            onClick={() => onAddEffect('watermark')}
          >
            <StarIcon />
          </IconButton>
        </Tooltip>
      </Flex>
    </ToolbarContainer>
  );
}; 