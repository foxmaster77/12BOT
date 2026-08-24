import React, { useState, useEffect } from 'react';

interface SitePreviewProps {
  previewUrl?: string;
  refreshTrigger?: number;
}

export default function SitePreview({
  previewUrl = 'http://localhost:4000/preview/index.html',
  refreshTrigger = 0,
}: SitePreviewProps) {
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    setIframeKey((prev) => prev + 1);
  }, [refreshTrigger]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', background: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></span>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#eab308' }}></span>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e' }}></span>
          <span style={{ marginLeft: '12px', color: '#94a3b8', fontSize: '13px', fontFamily: 'monospace' }}>
            Live Output Preview (http://localhost:4000/preview)
          </span>
        </div>
        <button
          onClick={() => setIframeKey((k) => k + 1)}
          style={{
            background: '#334155',
            color: '#f8fafc',
            border: 'none',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          🔄 Refresh
        </button>
      </div>
      <iframe
        key={iframeKey}
        src={previewUrl}
        style={{
          width: '100%',
          flex: 1,
          border: 'none',
          background: '#ffffff',
          minHeight: '600px',
        }}
        title="Live Generated Website"
      />
    </div>
  );
}
