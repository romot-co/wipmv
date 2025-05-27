import React, { memo, useState } from 'react';
import { Flex, Box, Text, Button } from '@radix-ui/themes';
import { ImageIcon, TrashIcon } from '@radix-ui/react-icons';
import styled from 'styled-components';

/**
 * 画像アップローダーのプロパティ
 */
export interface ImageUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  placeholder?: string;
  disabled?: boolean;
}

const UploaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

const InputContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: stretch;
`;

const UrlInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-size: 13px;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: var(--bg-secondary);
  }
  
  &::placeholder {
    color: var(--text-muted);
  }
`;

const FileInputButton = styled(Button)`
  position: relative;
  overflow: hidden;
  
  input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }
`;

const PreviewContainer = styled.div`
  position: relative;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
  background-color: var(--bg-secondary);
  max-height: 200px;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: auto;
  max-height: 200px;
  object-fit: cover;
  display: block;
`;

const PreviewPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: var(--text-muted);
  text-align: center;
  min-height: 100px;
`;

const RemoveButton = styled(Button)`
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px;
  min-width: 0;
  width: 24px;
  height: 24px;
  border-radius: 4px;
`;

/**
 * 画像アップローダーコンポーネント
 * - URL入力とファイルアップロードの両方に対応
 * - 画像プレビュー機能付き
 * - 現代的なUI/UXデザイン
 */
export const ImageUploader = memo<ImageUploaderProps>(({
  label,
  value,
  onChange,
  accept = 'image/*',
  placeholder = '画像URLを入力またはファイルを選択',
  disabled = false
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      try {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            onChange(event.target.result as string);
            setIsLoading(false);
          }
        };
        reader.onerror = () => {
          console.error('ファイルの読み込みに失敗しました');
          setIsLoading(false);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('ファイル処理エラー:', error);
        setIsLoading(false);
      }
    }
  };

  const handleClear = () => {
    if (!disabled) {
      onChange('');
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const showPreview = value && (value.startsWith('data:') || isValidUrl(value));

  return (
    <UploaderContainer>
      {label && (
        <Text size="2" weight="medium" color="gray">
          {label}
        </Text>
      )}
      
      <InputContainer>
        <UrlInput
          type="text"
          value={value}
          onChange={(e) => !disabled && onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
        
        <FileInputButton
          variant="soft"
          size="2"
          disabled={disabled || isLoading}
        >
          <ImageIcon width="14" height="14" />
          {isLoading ? '読込中...' : 'ファイル'}
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={disabled || isLoading}
          />
        </FileInputButton>
      </InputContainer>

      <PreviewContainer>
        {showPreview ? (
          <>
            <PreviewImage
              src={value}
              alt="プレビュー"
              onError={() => console.error('画像の読み込みに失敗しました')}
            />
            {!disabled && (
              <RemoveButton
                variant="solid"
                size="1"
                color="red"
                onClick={handleClear}
              >
                <TrashIcon width="12" height="12" />
              </RemoveButton>
            )}
          </>
        ) : (
          <PreviewPlaceholder>
            <ImageIcon width="24" height="24" style={{ marginBottom: '8px' }} />
            <Text size="1" color="gray">
              {value ? '画像を読み込めません' : '画像プレビュー'}
            </Text>
          </PreviewPlaceholder>
        )}
      </PreviewContainer>
    </UploaderContainer>
  );
});

ImageUploader.displayName = 'ImageUploader'; 