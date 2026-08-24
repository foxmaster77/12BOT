import { UniversalApiClient } from '../universalApiClient.js';

export async function callGemini(model, systemPrompt, userPrompt, apiKey) {
  return UniversalApiClient.callGemini(model, systemPrompt, userPrompt, apiKey);
}
