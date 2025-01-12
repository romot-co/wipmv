import { FC } from 'react';
import { EffectBase } from '../core/EffectBase';
import { EffectType, EffectConfig } from '../core/types';
import { BackgroundSettings } from '../features/background/BackgroundSettings';
import { TextSettings } from '../features/text/TextSettings';
import { WaveformSettings } from '../features/waveform/WaveformSettings';
import { WatermarkSettings } from '../features/watermark/WatermarkSettings';

interface InspectorProps {
  effect: EffectBase;
  onChange: (newConfig: Partial<EffectConfig>) => void;
}

export const Inspector: FC<InspectorProps> = ({ effect, onChange }) => {
  const config = effect.getConfig();

  return (
    <div className="inspector">
      {(() => {
        switch (config.type) {
          case EffectType.Background:
            return <BackgroundSettings config={config} onChange={onChange} />;
          case EffectType.Text:
            return <TextSettings config={config} onChange={onChange} />;
          case EffectType.Waveform:
            return <WaveformSettings config={config} onChange={onChange} />;
          case EffectType.Watermark:
            return <WatermarkSettings config={config} onChange={onChange} />;
          default:
            return null;
        }
      })()}
    </div>
  );
}; 