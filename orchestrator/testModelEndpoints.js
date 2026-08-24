import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testGroq() {
  const apiKey = process.env.GROQ_API_KEY_1;
  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama-3.3-70b-specdec', 'mixtral-8x7b-32768'];
  for (const m of models) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: m, messages: [{ role: 'user', content: 'hi' }] })
      });
      const data = await res.json();
      console.log(`[Groq ${m}] Status: ${res.status}`, data.choices?.[0]?.message?.content || data.error?.message);
      if (res.ok) return m;
    } catch (e) {
      console.log(`[Groq ${m}] Err:`, e.message);
    }
  }
}

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY_1;
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.5-flash'];
  for (const m of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'hi' }] }] })
      });
      const data = await res.json();
      console.log(`[Gemini ${m}] Status: ${res.status}`, data.candidates?.[0]?.content?.parts?.[0]?.text || data.error?.message);
      if (res.ok) return m;
    } catch (e) {
      console.log(`[Gemini ${m}] Err:`, e.message);
    }
  }
}

async function testDeepSeek() {
  const apiKey = process.env.DEEPSEEK_API_KEY_1;
  try {
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: 'hi' }] })
    });
    const data = await res.json();
    console.log(`[DeepSeek deepseek-chat] Status: ${res.status}`, data.choices?.[0]?.message?.content || data.error?.message);
  } catch (e) {
    console.log('[DeepSeek] Err:', e.message);
  }
}

async function testCerebras() {
  const apiKey = process.env.CEREBRAS_API_KEY_1;
  const models = ['llama3.3-70b', 'llama3.1-8b', 'llama3.1-70b', 'llama-3.3-70b'];
  for (const m of models) {
    try {
      const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: m, messages: [{ role: 'user', content: 'hi' }] })
      });
      const data = await res.json();
      console.log(`[Cerebras ${m}] Status: ${res.status}`, data.choices?.[0]?.message?.content || data.error?.message);
      if (res.ok) return m;
    } catch (e) {
      console.log(`[Cerebras ${m}] Err:`, e.message);
    }
  }
}

async function testOpenRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY_1;
  const models = ['qwen/qwen-2.5-coder-32b-instruct:free', 'meta-llama/llama-3.2-3b-instruct:free', 'google/gemini-2.0-flash-exp:free'];
  for (const m of models) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: m, messages: [{ role: 'user', content: 'hi' }] })
      });
      const data = await res.json();
      console.log(`[OpenRouter ${m}] Status: ${res.status}`, data.choices?.[0]?.message?.content || data.error?.message);
      if (res.ok) return m;
    } catch (e) {
      console.log(`[OpenRouter ${m}] Err:`, e.message);
    }
  }
}

async function main() {
  console.log('Testing provider endpoints...');
  await testGroq();
  await testGemini();
  await testDeepSeek();
  await testCerebras();
  await testOpenRouter();
}

main();
