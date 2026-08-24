import { UniversalApiClient } from '../universalApiClient.js';

export async function callOpenRouter(model, systemPrompt, userPrompt, apiKey) {
  return UniversalApiClient.callOpenAiCompatible('openrouter', model, systemPrompt, userPrompt, apiKey);
}
