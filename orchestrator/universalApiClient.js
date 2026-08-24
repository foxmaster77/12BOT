import dotenv from 'dotenv';
dotenv.config();

/**
 * Strip chain-of-thought <think>...</think> blocks that Qwen models emit
 */
function stripThinkTags(text) {
  if (!text) return '';
  // Remove <think>...</think> blocks (including multiline)
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

/**
 * Universal LLM Client supporting OpenAI-compatible APIs, Google Gemini, and Ollama.
 */
export class UniversalApiClient {
  /**
   * Determine endpoint & headers based on API provider name
   */
  static getProviderConfig(apiProvider, apiKey) {
    switch (apiProvider.toLowerCase()) {
      case 'groq':
        return {
          baseUrl: 'https://api.groq.com/openai/v1',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        };
      case 'openrouter':
        return {
          baseUrl: 'https://openrouter.ai/api/v1',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/the-office-ai',
            'X-Title': 'The Office AI Dev Team',
          },
        };
      case 'together':
        return {
          baseUrl: 'https://api.together.xyz/v1',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        };
      case 'cerebras':
        return {
          baseUrl: 'https://api.cerebras.ai/v1',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        };
      case 'deepseek':
        return {
          baseUrl: 'https://api.deepseek.com/v1',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        };
      case 'github_models':
        return {
          baseUrl: 'https://models.inference.ai.azure.com',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        };
      case 'huggingface':
        return {
          baseUrl: 'https://api-inference.huggingface.co/v1',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        };
      default:
        return {
          baseUrl: 'https://api.openai.com/v1',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        };
    }
  }

  /**
   * Call Google Gemini API
   */
  static async callGemini(model, systemPrompt, userPrompt, apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const payload = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.text();
      const err = new Error(`Gemini API error (${res.status}): ${errBody}`);
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const tokensUsed = data.usageMetadata?.totalTokenCount || 500;
    return { text: stripThinkTags(rawText), tokensUsed };
  }

  /**
   * Call Local Ollama API
   */
  static async callOllama(model, systemPrompt, userPrompt, host = 'http://localhost:11434') {
    const url = `${host}/api/chat`;
    const payload = {
      model: model || 'llama3.2:3b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = new Error(`Ollama API error (${res.status}): ${res.statusText}`);
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    const rawText = data.message?.content || '';
    const tokensUsed = data.eval_count || 350;
    return { text: stripThinkTags(rawText), tokensUsed };
  }

  /**
   * Call generic OpenAI-compatible endpoint
   */
  static async callOpenAiCompatible(provider, model, systemPrompt, userPrompt, apiKey) {
    const config = this.getProviderConfig(provider, apiKey);
    const url = `${config.baseUrl}/chat/completions`;

    const payload = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.text();
      const err = new Error(`${provider} API error (${res.status}): ${errBody}`);
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    const rawText = data.choices?.[0]?.message?.content || '';
    const tokensUsed = data.usage?.total_tokens || 450;
    return { text: stripThinkTags(rawText), tokensUsed };
  }

  /**
   * Execute model call based on agent config
   */
  static async executeAgentCall(agent, userPrompt) {
    const apiKey = process.env[agent.api_key_env];
    const isGemini = agent.api.toLowerCase() === 'gemini';

    if (!apiKey) {
      // Check if Ollama is available as fallback or throw missing key error
      if (process.env.OLLAMA_ENABLED === 'true') {
        console.warn(`[ApiClient] No API key for ${agent.id} (${agent.api_key_env}). Trying Ollama local fallback...`);
        return this.callOllama(process.env.OLLAMA_MODEL, agent.system_prompt, userPrompt, process.env.OLLAMA_HOST);
      }
      throw new Error(`Missing API Key: ${agent.api_key_env} is not set in environment.`);
    }

    if (isGemini) {
      return this.callGemini(agent.model, agent.system_prompt, userPrompt, apiKey);
    } else {
      return this.callOpenAiCompatible(agent.api, agent.model, agent.system_prompt, userPrompt, apiKey);
    }
  }
}
