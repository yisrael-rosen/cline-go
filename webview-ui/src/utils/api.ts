import { type ApiConfiguration, anthropicDefaultModelId, anthropicModels } from "../../../src/shared/api"

interface NormalizedApiConfiguration {
    selectedModelId: string;
    selectedModelInfo: typeof anthropicModels[keyof typeof anthropicModels];
}

export function normalizeApiConfiguration(apiConfiguration?: ApiConfiguration): NormalizedApiConfiguration {
    const modelId = apiConfiguration?.apiModelId;

    let selectedModelId: string;
    let selectedModelInfo = anthropicModels[anthropicDefaultModelId];

    if (modelId && modelId in anthropicModels) {
        selectedModelId = modelId;
        selectedModelInfo = anthropicModels[modelId as keyof typeof anthropicModels];
    } else {
        selectedModelId = anthropicDefaultModelId;
    }

    return { selectedModelId, selectedModelInfo };
}
