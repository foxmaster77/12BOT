import { UniversalApiClient } from '../universalApiClient.js';

export async function callDeepSeek(model, systemPrompt, userPrompt, apiKey) {
  return UniversalApiClient.callOpenAiCompatible('deepseek', model, systemPrompt, userPrompt, apiKey);
}
