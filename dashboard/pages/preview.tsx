import React from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function PreviewPage() {
  const router = useRouter();
  const niche = (router.query.niche as string) || 'Website';
  const prompt = (router.query.prompt as string) || '';

  const previewSrc = `/api/preview?niche=${encodeURIComponent(niche)}&prompt=${encodeURIComponent(prompt)}`;

  return (
    <>
      <Head>
        <title>{niche} — Live Preview | 12BOT</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <iframe
        src={previewSrc}
        style={{
          width: '100vw',
          height: '100vh',
          border: 'none',
          margin: 0,
          padding: 0,
          display: 'block',
          background: '#070b14',
        }}
        title="12BOT Generated Site Preview"
      />
    </>
  );
}
