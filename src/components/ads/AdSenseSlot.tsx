import React, { useEffect, useRef } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';

interface AdSenseSlotProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const AdSenseSlot: React.FC<AdSenseSlotProps> = ({
  slot,
  format = 'auto',
  responsive = true,
  className = '',
  style,
}) => {
  const { settings } = useSettingsStore();
  const adRef = useRef<HTMLModElement>(null);
  
  const isDev = (import.meta as any).env?.DEV;
  
  // Example settings structure for ads (we will update store later):
  // settings.adsEnabled, settings.adsPublisherId

  const adsEnabled = settings?.adsEnabled ?? false;
  const publisherId = settings?.adsPublisherId ?? '';

  useEffect(() => {
    if (isDev || !adsEnabled || !publisherId) return;

    try {
      if (adRef.current && !adRef.current.hasAttribute('data-adsbygoogle-status')) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (e) {
      if ((e as any)?.code !== 'permission-denied') { console.error('AdSense error:', e); }
    }
  }, [adsEnabled, publisherId, isDev]);

  if (!adsEnabled || !publisherId) return null;

  if (isDev) {
    return (
      <div className={`bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-sm ${className}`} style={{ minHeight: '100px', ...style }}>
        AdSense Placeholder (Slot: {slot})
      </div>
    );
  }

  return (
    <div className={`ad-container overflow-hidden ${className}`} style={style}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client={publisherId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
};
