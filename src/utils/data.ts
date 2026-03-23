export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  context_length: number;
  architecture?: {
    input_modalities?: string[];
  };
  pricing: {
    prompt: string;
    completion: string;
    input_cache_read?: string;
    image: string;
    request: string;
  };
  top_provider: {
    context_length: number;
    max_completion_tokens: number;
    is_moderated: boolean;
  };
  supported_parameters?: string[];
}

export interface FormattedModel {
  id: string;
  name: string;
  provider: string;
  modelName: string;
  description: string;
  contextLength: number;
  inputPrice1M: number;
  outputPrice1M: number;
  cacheReadPrice1M: number | null; // null if cache read is not supported
  totalAvg1M: number; // roughly 1M input + 1M output
  isFree: boolean;
  isVariable: boolean;
  maxOutputTokens: number | null;
  hasVision: boolean;
  hasFunctionCalling: boolean;
}

export const fetchModels = async (): Promise<FormattedModel[]> => {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models');
    const json = await res.json();
    return json.data.map((m: OpenRouterModel) => {
      const promptPricing = parseFloat(m.pricing.prompt || '0');
      const completionPricing = parseFloat(m.pricing.completion || '0');
      
      const inputPrice = promptPricing * 1000000;
      const outputPrice = completionPricing * 1000000;
      
      let cacheReadPrice1M: number | null = null;
      if (m.pricing.input_cache_read) {
         const rawCache = parseFloat(m.pricing.input_cache_read);
         // Filter out negative (dynamic) or zero prices masquerading as cache support
         if (rawCache > 0) {
            cacheReadPrice1M = Number((rawCache * 1000000).toFixed(4));
         }
      }
      
      const isVariable = promptPricing < 0 || completionPricing < 0;

      const [provider, ...rest] = m.id.split('/');
      const modelName = rest.join('/');

      return {
        id: m.id,
        name: m.name,
        provider: provider.charAt(0).toUpperCase() + provider.slice(1),
        modelName,
        description: m.description,
        contextLength: m.context_length,
        inputPrice1M: isVariable ? 0 : Number(inputPrice.toFixed(4)),
        outputPrice1M: isVariable ? 0 : Number(outputPrice.toFixed(4)),
        cacheReadPrice1M,
        totalAvg1M: isVariable ? 0 : Number(((inputPrice + outputPrice) / 2).toFixed(4)),
        isFree: inputPrice === 0 && outputPrice === 0 && !isVariable,
        isVariable,
        maxOutputTokens: m.top_provider?.max_completion_tokens || null,
        hasVision: m.architecture?.input_modalities?.includes('image') || false,
        hasFunctionCalling: m.supported_parameters?.includes('tools') || m.supported_parameters?.includes('tool_choice') || false
      };
    }).sort((a: FormattedModel, b: FormattedModel) => b.contextLength - a.contextLength); // sort by context length default
  } catch (error) {
    console.error('Failed to fetch models', error);
    return [];
  }
};
