import { createAzure } from '@ai-sdk/azure';
import { openai } from '@ai-sdk/openai';
import { LanguageModel } from 'ai';

let model: LanguageModel;

if (process.env.OPENAI_PROVIDER === 'azure') {
  if (
    !process.env.AZURE_OPENAI_DEPLOYMENT_MODEL ||
    !process.env.AZURE_OPENAI_API_KEY
  ) {
    throw new Error(
      'AZURE_OPENAI_DEPLOYMENT_MODEL and AZURE_OPENAI_API_KEY are required'
    );
  }

  const hasEndpoint = !!process.env.AZURE_OPENAI_ENDPOINT;
  const hasResourceName = !!process.env.AZURE_OPENAI_RESOURCE_NAME;

  if (!hasEndpoint && !hasResourceName) {
    throw new Error(
      'Either AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_RESOURCE_NAME is required'
    );
  }

  const azureProvider = createAzure(
    hasEndpoint
      ? {
          baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai`,
          apiKey: process.env.AZURE_OPENAI_API_KEY
        }
      : {
          resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME,
          apiKey: process.env.AZURE_OPENAI_API_KEY
        }
  );
  model = azureProvider(process.env.AZURE_OPENAI_DEPLOYMENT_MODEL);
} else {
  model = openai(process.env.OPENAI_MODEL || 'gpt-4.1-mini');
}

export { model };
