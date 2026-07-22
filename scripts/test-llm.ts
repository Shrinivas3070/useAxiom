import { getLlmProvider } from '@useaxiom/ai-providers';
console.log('LLM_PROVIDER env:', process.env.LLM_PROVIDER);
const provider = getLlmProvider();
console.log('Provider created:', provider.name);
