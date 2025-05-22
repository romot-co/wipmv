import React, { useState, useRef } from 'react';
import { Button, Flex, Box, Text } from '@radix-ui/themes';
import { UploadIcon, FileIcon, Cross2Icon } from '@radix-ui/react-icons';
import styled from 'styled-components';
import { isAudioFormatSupported } from '../utils/audio';

export interface AudioUploaderProps {
  onFileSelect: (file: File) => Promise<void>;
  onError: (error: Error) => void;
  disabled?: boolean;
}

const UploadArea = styled.div<{ isDragOver: boolean; isDisabled: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  border: 1px solid ${props => props.isDragOver ? 'var(--primary-color)' : 'var(--border-color)'};
  border-radius: 4px;
  background-color: ${props => props.isDragOver ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-tertiary)'};
  cursor: ${props => props.isDisabled ? 'not-allowed' : 'pointer'};
  transition: all 0.15s ease;
  width: 100%;
  max-width: 450px;
  text-align: center;
  opacity: ${props => props.isDisabled ? 0.6 : 1};
  
  &:hover {
    border-color: ${props => !props.isDisabled && 'var(--primary-color)'};
    background-color: ${props => !props.isDisabled && 'rgba(59, 130, 246, 0.1)'};
  }
`;

const FileInput = styled.input`
  display: none;
`;

const IconWrapper = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-bottom: 16px;
`;

const SelectedFileBox = styled(Box)`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: var(--bg-tertiary);
  border-radius: 4px;
  margin-top: 16px;
  border: 1px solid var(--border-color);
  width: 100%;
  max-width: 450px;
  
  svg {
    flex-shrink: 0;
    margin-right: 8px;
    color: var(--text-secondary);
  }
`;

const RemoveButton = styled(Button)`
  margin-left: auto;
  flex-shrink: 0;
`;

export const AudioUploader: React.FC<AudioUploaderProps> = ({ onFileSelect, onError, disabled = false }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File) => {
    if (!file || disabled) return;

    // Check supported audio format
    if (!isAudioFormatSupported(file.type)) {
      onError(new Error('対応していないファイル形式です。音声ファイルをアップロードしてください。'));
      return;
    }

    try {
      setIsLoading(true);
      setSelectedFile(file);
      await onFileSelect(file);
    } catch (error) {
      onError(error instanceof Error ? error : new Error('ファイルの読み込みに失敗しました'));
      setSelectedFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const file = event.dataTransfer.files?.[0];
    if (file && isAudioFormatSupported(file.type)) {
      handleFileChange(file);
    } else {
      onError(new Error('対応していないファイル形式です。音声ファイルをアップロードしてください。'));
    }
  };

  const handleAreaClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
  };

  // 表示するファイル名を短くする
  const formatFileName = (name: string): string => {
    if (name.length > 25) {
      return name.substring(0, 22) + '...';
    }
    return name;
  };

  return (
    <Flex direction="column" width="100%" align="center" gap="3">
      <Text size="5" weight="medium" mb="3">WIP Motion Video</Text>
      
      <UploadArea 
        isDragOver={isDragOver} 
        isDisabled={disabled || isLoading}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleAreaClick}
      >
        <IconWrapper>
          <UploadIcon width={24} height={24} color="#0366d6" />
        </IconWrapper>
        
        {isLoading ? (
          <Text size="2" weight="medium" color="gray">読み込み中...</Text>
        ) : (
          <>
            <Text size="2" weight="medium" mb="1">
              {selectedFile 
                ? 'クリックして別のファイルを選択' 
                : '音声ファイルをドロップ'}
            </Text>
            <Text size="1" color="gray">または</Text>
            <Button 
              mt="2" 
              variant="soft" 
              color="blue" 
              size="1"
              disabled={disabled || isLoading}
            >
              ファイルを選択
            </Button>
            <Text size="1" color="gray" mt="2">
              対応形式: MP3, WAV, AAC
            </Text>
          </>
        )}
        
        <FileInput
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleInputChange}
          disabled={disabled || isLoading}
        />
      </UploadArea>
      
      {selectedFile && (
        <SelectedFileBox>
          <FileIcon width={16} height={16} />
          <Text size="1">{formatFileName(selectedFile.name)}</Text>
          <RemoveButton 
            variant="ghost" 
            color="gray" 
            size="1" 
            onClick={handleRemoveFile}
          >
            <Cross2Icon width={12} height={12} />
          </RemoveButton>
        </SelectedFileBox>
      )}
    </Flex>
  );
}; 