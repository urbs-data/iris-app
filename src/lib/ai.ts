import { createAzure } from '@ai-sdk/azure';
import { openai } from '@ai-sdk/openai';
import { LanguageModel } from 'ai';

let model: LanguageModel;

if (process.env.OPENAI_PROVIDER === 'azure') {
  if (
    !process.env.AZURE_OPENAI_RESOURCE_NAME ||
    !process.env.AZURE_OPENAI_DEPLOYMENT_MODEL ||
    !process.env.AZURE_OPENAI_API_KEY
  ) {
    throw new Error(
      'AZURE_OPENAI_RESOURCE_NAME, AZURE_OPENAI_DEPLOYMENT_MODEL and AZURE_OPENAI_API_KEY are required'
    );
  }
  const azureProvider = createAzure({
    resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME,
    apiKey: process.env.AZURE_OPENAI_API_KEY
  });
  model = azureProvider(process.env.AZURE_OPENAI_DEPLOYMENT_MODEL);
  console.log('Azure OpenAI model loaded');
} else {
  model = openai(process.env.OPENAI_MODEL || 'gpt-4.1-mini');
}

export { model };
