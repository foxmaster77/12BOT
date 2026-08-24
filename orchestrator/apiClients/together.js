import { UniversalApiClient } from '../universalApiClient.js';

export async function callTogether(model, systemPrompt, userPrompt, apiKey) {
  return UniversalApiClient.callOpenAiCompatible('together', model, systemPrompt, userPrompt, apiKey);
}
