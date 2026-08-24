import { UniversalApiClient } from '../universalApiClient.js';

export async function callGroq(model, systemPrompt, userPrompt, apiKey) {
  return UniversalApiClient.callOpenAiCompatible('groq', model, systemPrompt, userPrompt, apiKey);
}
