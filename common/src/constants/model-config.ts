export const ALLOWED_MODEL_PREFIXES = ['deepseek-coder'] as const

export const costModes = ['normal'] as const
export type CostMode = 'normal'

export const models = {
  deepseekCoder: 'deepseek-coder',
} as const

export const shortModelNames = {
  'deepseek-coder': 'deepseek-coder',
}

export type Model = 'deepseek-coder'

export function supportsCacheControl(model: Model): boolean {
  return false
}

export function getModelFromShortName(modelName: string | undefined): Model {
  return 'deepseek-coder'
}

export function getLogoForModel(modelName: string): string | undefined {
  return undefined
}

export const getModelForMode = (
  costMode: CostMode,
  operation: 'agent' | 'file-requests' | 'check-new-files',
) => {
  return 'deepseek-coder'
}


