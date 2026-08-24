import { UniversalApiClient } from '../universalApiClient.js';

export async function callHuggingFace(model, systemPrompt, userPrompt, apiKey) {
  return UniversalApiClient.callOpenAiCompatible('huggingface', model, systemPrompt, userPrompt, apiKey);
}
