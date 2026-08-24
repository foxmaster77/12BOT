import { UniversalApiClient } from '../universalApiClient.js';

export async function callGitHubModels(model, systemPrompt, userPrompt, apiKey) {
  return UniversalApiClient.callOpenAiCompatible('github_models', model, systemPrompt, userPrompt, apiKey);
}
