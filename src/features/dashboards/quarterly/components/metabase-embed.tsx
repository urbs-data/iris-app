'use client';

import { useEffect, useRef, useState } from 'react';
import { getMetabaseToken } from '../actions/get-metabase-token';

export function MetabaseEmbed() {
  const [token, setToken] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    getMetabaseToken().then(setToken);
  }, []);

  useEffect(() => {
    if (!token || scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    // Set config BEFORE loading the script
    (window as any).metabaseConfig = {
      theme: { preset: 'light' },
      isGuest: true,
      instanceUrl: 'https://metabase.iris-platform.ai'
    };

    const script = document.createElement('script');
    script.src = 'https://metabase.iris-platform.ai/app/embed.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [token]);

  if (!token) {
    return (
      <div className='flex flex-1 items-center justify-center'>
        <div className='border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent' />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className='flex flex-1 flex-col'
      style={{ minHeight: 'calc(100vh - 200px)' }}
      dangerouslySetInnerHTML={{
        __html: `<metabase-dashboard token="${token}" with-title="false" with-downloads="true" style="width:100%;flex:1;display:flex;flex-direction:column;min-height:100%"></metabase-dashboard>`
      }}
    />
  );
}
