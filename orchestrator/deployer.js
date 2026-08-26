/**
 * orchestrator/deployer.js
 *
 * Handles auto-deploy after pipeline completion.
 *
 * Priority:
 *  1. If VERCEL_TOKEN is set → deploys to Vercel via the Deploy API v13.
 *  2. Otherwise → starts (or reuses) a local Express static server on PREVIEW_PORT.
 *
 * Returns: { url: string, provider: 'vercel' | 'local' }
 */

import fs from 'fs';
import path from 'path';
import http from 'http';
import express from 'express';

// node-fetch is a lightweight ESM-compatible fetch for Node < 18
// For Node 18+, native fetch is available. We use a runtime guard.
let fetchFn;
async function getFetch() {
  if (fetchFn) return fetchFn;
  if (typeof globalThis.fetch === 'function') {
    fetchFn = globalThis.fetch.bind(globalThis);
  } else {
    const mod = await import('node-fetch');
    fetchFn = mod.default;
  }
  return fetchFn;
}

// Reuse the same local preview server across calls
let _localServer = null;
let _localPort = null;

/**
 * Start (or reuse) a local static preview server.
 * @param {string} outputDir
 * @param {number} port
 * @returns {Promise<string>} URL
 */
async function startLocalPreview(outputDir, port) {
  if (_localServer && _localPort === port) {
    return `http://localhost:${port}`;
  }

  // Shut down previous server if port changed
  if (_localServer) {
    await new Promise((resolve) => _localServer.close(resolve));
    _localServer = null;
  }

  const app = express();
  app.use(express.static(outputDir));
  // SPA fallback
  app.get('*', (req, res) => {
    const indexPath = path.join(outputDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('No generated site found yet.');
    }
  });

  await new Promise((resolve, reject) => {
    _localServer = http.createServer(app);
    _localServer.listen(port, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  _localPort = port;
  console.log(`[Deployer] Local preview server started at http://localhost:${port}`);
  return `http://localhost:${port}`;
}

/**
 * Deploy to Vercel using the Deploy API v13.
 * @param {string} outputDir
 * @param {string} token
 * @returns {Promise<string>} deployment URL
 */
async function deployToVercel(outputDir, token) {
  const fetch = await getFetch();

  // Read all files in outputDir
  const fileNames = fs.readdirSync(outputDir).filter((f) => {
    const stat = fs.statSync(path.join(outputDir, f));
    return stat.isFile();
  });

  if (fileNames.length === 0) {
    throw new Error('[Deployer] No files found in generated-site/ to deploy.');
  }

  // Step 1: Upload files to Vercel blob store
  const uploadedFiles = [];
  for (const fileName of fileNames) {
    const filePath = path.join(outputDir, fileName);
    const content = fs.readFileSync(filePath);
    const contentType = guessContentType(fileName);

    const uploadRes = await fetch('https://api.vercel.com/v2/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType,
        'x-vercel-digest': await sha1(content),
      },
      body: content,
    });

    if (!uploadRes.ok) {
      const body = await uploadRes.text();
      throw new Error(`[Deployer] File upload failed for ${fileName}: ${body}`);
    }

    const digest = await sha1(content);
    uploadedFiles.push({ file: fileName, sha: digest, size: content.length });
  }

  // Step 2: Create deployment
  const projectName = process.env.VERCEL_PROJECT_ID || '12bot-generated-site';
  const orgId = process.env.VERCEL_ORG_ID;

  const deployPayload = {
    name: projectName,
    files: uploadedFiles,
    projectSettings: { framework: null },
    target: 'production',
  };

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  if (orgId) headers['x-vercel-team-id'] = orgId;

  const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers,
    body: JSON.stringify(deployPayload),
  });

  if (!deployRes.ok) {
    const body = await deployRes.text();
    throw new Error(`[Deployer] Vercel deployment failed: ${body}`);
  }

  const deployData = await deployRes.json();
  const url = `https://${deployData.url}`;
  console.log(`[Deployer] Deployed to Vercel: ${url}`);
  return url;
}

/**
 * Simple SHA-1 hash for Vercel file uploads (required by their API).
 */
async function sha1(buffer) {
  const { createHash } = await import('crypto');
  return createHash('sha1').update(buffer).digest('hex');
}

function guessContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const map = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.sql': 'text/plain',
  };
  return map[ext] || 'application/octet-stream';
}

// Track last deploy result for GET /api/deploy-status
export let lastDeployResult = null;

/**
 * Main export: deploy the generated site.
 * @param {string} outputDir - absolute path to generated-site/
 * @returns {Promise<{ url: string, provider: 'vercel' | 'local' }>}
 */
export async function deploy(outputDir) {
  const vercelToken = process.env.VERCEL_TOKEN;
  const previewPort = parseInt(process.env.PREVIEW_PORT || '4002', 10);

  try {
    if (vercelToken) {
      console.log('[Deployer] VERCEL_TOKEN detected — deploying to Vercel...');
      const url = await deployToVercel(outputDir, vercelToken);
      lastDeployResult = { url, provider: 'vercel', timestamp: new Date().toISOString() };
    } else {
      console.log('[Deployer] No VERCEL_TOKEN — starting local preview server...');
      const url = await startLocalPreview(outputDir, previewPort);
      lastDeployResult = { url, provider: 'local', timestamp: new Date().toISOString() };
    }
  } catch (err) {
    console.error('[Deployer] Deploy failed, falling back to local:', err.message);
    const url = await startLocalPreview(outputDir, previewPort);
    lastDeployResult = { url, provider: 'local', timestamp: new Date().toISOString(), error: err.message };
  }

  return lastDeployResult;
}
