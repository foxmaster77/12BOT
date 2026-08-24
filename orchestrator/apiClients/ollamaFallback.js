import { UniversalApiClient } from '../universalApiClient.js';

export async function callOllama(model, systemPrompt, userPrompt, host = 'http://localhost:11434') {
  return UniversalApiClient.callOllama(model, systemPrompt, userPrompt, host);
}
