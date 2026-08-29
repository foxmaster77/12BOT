import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { generateSiteHtml } from '../lib/templates';

export default function PreviewPage() {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [currentNiche, setCurrentNiche] = useState<string>('Website');

  useEffect(() => {
    // 1. Try to load dynamically stored HTML from generation
    const stored = typeof window !== 'undefined' ? localStorage.getItem('12bot_preview_html') : null;
    const storedNiche = typeof window !== 'undefined' ? localStorage.getItem('12bot_preview_niche') : null;
    const storedPrompt = typeof window !== 'undefined' ? localStorage.getItem('12bot_preview_prompt') : null;

    if (stored) {
      setHtmlContent(stored);
      if (storedNiche) setCurrentNiche(storedNiche);
    } else {
      // Default to Website or URL search param
      const urlParams = new URLSearchParams(window.location.search);
      const nicheParam = urlParams.get('niche') || storedNiche || 'Website';
      const promptParam = urlParams.get('prompt') || storedPrompt || '';
      setCurrentNiche(nicheParam);
      const initialHtml = generateSiteHtml(nicheParam, promptParam);
      setHtmlContent(initialHtml);
    }
  }, []);

  return (
    <>
      <Head>
        <title>{currentNiche} — Live Preview | 12BOT</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <iframe
        srcDoc={htmlContent}
        style={{
          width: '100vw',
          height: '100vh',
          border: 'none',
          margin: 0,
          padding: 0,
          display: 'block',
          background: '#000',
        }}
        title="12BOT Generated Site Preview"
        sandbox="allow-scripts allow-forms allow-same-origin allow-modals allow-popups"
      />
    </>
  );
}
