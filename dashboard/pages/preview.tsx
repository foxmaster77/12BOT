import type { GetServerSideProps } from 'next';
import { generateSiteHtml } from '../lib/templates';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const niche = (context.query.niche as string) || 'Website';
  const prompt = (context.query.prompt as string) || '';
  const html = generateSiteHtml(niche, prompt);

  context.res.setHeader('Content-Type', 'text/html; charset=utf-8');
  context.res.write(html);
  context.res.end();

  return { props: {} };
};

export default function Preview() {
  return null;
}
