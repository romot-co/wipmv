import React, { useMemo } from 'react';
import { Box, IconButton } from '@radix-ui/themes';
import { Cross1Icon } from '@radix-ui/react-icons';
import { useApp } from '../contexts/AppContext';
import { EffectSettings } from './EffectSettings';
import { AppError, ErrorType } from '../core/types/error';
import { EffectBase } from '../core/types/core';
import { EffectConfig } from '../core/types/effect';
import './SettingsPanel.css';
import debug from 'debug';

const log = debug('app:SettingsPanel');

export const SettingsPanel: React.FC = () => {
  const {
    ui: { isSettingsPanelOpen, selectedEffectId },
    effectState: { effects },
    closeSettingsPanel,
    updateEffect,
    audioState: { duration }
  } = useApp();

  const selectedEffect = useMemo(() => {
    return effects.find((effect: EffectBase<EffectConfig>) => effect.getId() === selectedEffectId);
  }, [effects, selectedEffectId]);

  const handleUpdateEffect = (config: Partial<EffectConfig>) => {
    if (selectedEffectId) {
      try {
        log('Updating effect from panel:', selectedEffectId, config);
        updateEffect(selectedEffectId, config);
      } catch (error) {
        const appError = error instanceof AppError ? error : new AppError(ErrorType.EFFECT_CONFIG_INVALID, 'エフェクト設定の更新に失敗しました', error as Error);
        console.error('Error updating effect settings:', appError);
      }
    }
  };

  const panelClassName = `settings-panel ${isSettingsPanelOpen ? 'open' : ''}`;

  return (
    <Box className={panelClassName}>
      <Box className="settings-panel-header" p="2">
        <IconButton variant="ghost" color="gray" onClick={closeSettingsPanel}>
          <Cross1Icon />
        </IconButton>
      </Box>

      <Box className="settings-panel-content" p="3">
        {selectedEffect ? (
          <EffectSettings
            key={selectedEffect.getId()}
            effect={selectedEffect}
            onUpdate={handleUpdateEffect}
            duration={duration}
          />
        ) : (
          <Box p="4" style={{ textAlign: 'center', color: 'var(--gray-11)' }}>
            エフェクトを選択してください
          </Box>
        )}
      </Box>
    </Box>
  );
};
