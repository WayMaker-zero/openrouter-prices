export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
    image: string;
    request: string;
  };
  top_provider: {
    context_length: number;
    max_completion_tokens: number;
    is_moderated: boolean;
  };
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
  totalAvg1M: number; // roughly 1M input + 1M output
  isFree: boolean;
  isVariable: boolean;
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
        totalAvg1M: isVariable ? 0 : Number(((inputPrice + outputPrice) / 2).toFixed(4)),
        isFree: inputPrice === 0 && outputPrice === 0 && !isVariable,
        isVariable
      };
    }).sort((a: FormattedModel, b: FormattedModel) => b.contextLength - a.contextLength); // sort by context length default
  } catch (error) {
    console.error('Failed to fetch models', error);
    return [];
  }
};
