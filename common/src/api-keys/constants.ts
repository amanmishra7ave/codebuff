export const ALGORITHM = 'aes-256-gcm'
export const IV_LENGTH = 12
export const AUTH_TAG_LENGTH = 16

export const API_KEY_TYPES = ['local'] as const
export type ApiKeyType = (typeof API_KEY_TYPES)[number]

export const KEY_PREFIXES: Record<ApiKeyType, string> = {
  local: 'local-',
}
export const KEY_LENGTHS: Record<ApiKeyType, number> = {
  local: 5,
}

export const READABLE_NAME: Record<ApiKeyType, string> = {
  local: 'Local',
}
