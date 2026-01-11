// import { createAzure } from '@ai-sdk/azure';

// const azureProvider = createAzure({
//   resourceName: 'cog-dr4txjkespw6g',
//   apiKey: 'your-api-key'
// });

// export const model = azureProvider('chat-gpt-4.1-mini');

import { openai } from '@ai-sdk/openai';

export const model = openai('gpt-4.1-mini');
