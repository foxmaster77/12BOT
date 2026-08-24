import { UniversalApiClient } from '../universalApiClient.js';

export async function callCerebras(model, systemPrompt, userPrompt, apiKey) {
  return UniversalApiClient.callOpenAiCompatible('cerebras', model, systemPrompt, userPrompt, apiKey);
}
