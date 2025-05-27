import React from 'react';
import { Flex, Text, Button } from '@radix-ui/themes';
import { UploadIcon, PlayIcon } from '@radix-ui/react-icons';
import styled from 'styled-components';

const WelcomeContainer = styled.div`
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 24px 16px;
  text-align: center;
`;

const WelcomeTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
`;

const WelcomeDescription = styled.p`
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 16px 0;
  line-height: 1.5;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 16px 0;
  text-align: left;
`;

const FeatureItem = styled.li`
  font-size: 12px;
  color: var(--text-secondary);
  margin: 8px 0;
  padding-left: 16px;
  position: relative;
  
  &:before {
    content: '•';
    color: var(--primary-color);
    position: absolute;
    left: 0;
  }
`;

export const WelcomeMessage: React.FC = () => {
  return (
    <WelcomeContainer>
      <Flex direction="column" align="center" gap="3">
        <UploadIcon width="32" height="32" style={{ color: 'var(--primary-color)' }} />
        
        <WelcomeTitle>WIP Motion Video へようこそ</WelcomeTitle>
        
        <WelcomeDescription>
          音声ファイルをアップロードして、<br />
          魅力的な動画を作成しましょう。
        </WelcomeDescription>
        
        <FeatureList>
          <FeatureItem>🎵 音声ファイルのアップロード</FeatureItem>
          <FeatureItem>🎨 背景・テキスト・波形の追加</FeatureItem>
          <FeatureItem>⚡ リアルタイムプレビュー</FeatureItem>
          <FeatureItem>📹 高品質動画エクスポート</FeatureItem>
        </FeatureList>
        
        <Text size="2" color="gray" style={{ textAlign: 'center' }}>
          対応フォーマット: MP3, WAV, AAC
        </Text>
      </Flex>
    </WelcomeContainer>
  );
}; 