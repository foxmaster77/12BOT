import type { NextApiRequest, NextApiResponse } from 'next';
import { generateSiteHtml } from '../../lib/templates';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const niche = (req.query.niche as string) || 'Website';
  const prompt = (req.query.prompt as string) || '';
  const html = generateSiteHtml(niche, prompt);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}
