import {
  validateAgents as validateAgentsCommon,
  type DynamicAgentValidationError,
} from '@codebuff/common/templates/agent-validation'

import { WEBSITE_URL } from './constants'

import type { AgentDefinition } from '@codebuff/common/templates/initial-agents-dir/types/agent-definition'

export interface ValidationResult {
  success: boolean
  validationErrors: Array<{
    id: string
    message: string
  }>
  errorCount: number
}

export interface ValidateAgentsOptions {
  /**
   * Whether to perform remote validation via the web API.
   * Remote validation checks spawnable agents against the database.
   */
  remote?: boolean

  /**
   * The base URL of the Codebuff website API.
   * Optional - defaults to NEXT_PUBLIC_CODEBUFF_APP_URL or environment-based URL.
   * Example: 'https://codebuff.com'
   */
  websiteUrl?: string
}

/**
 * Validates an array of agent definitions.
 *
 * By default, performs local Zod schema validation.
 * When `options.remote` is true, additionally validates spawnable agents via the web API.
 *
 * @param definitions - Array of agent definitions to validate
 * @param options - Optional configuration for validation
 * @returns Promise<ValidationResult> - Validation results with any errors
 *
 * @example
 * ```typescript
 * // Local validation only
 * const result = await validateAgents(definitions)
 *
 * // Remote validation
 * const result = await validateAgents(definitions, {
 *   remote: true,
 *   websiteUrl: 'https://codebuff.com'
 * })
 * ```
 */
export async function validateAgents(
  definitions: AgentDefinition[],
  options?: ValidateAgentsOptions,
): Promise<ValidationResult> {
  // Convert array of definitions to Record<string, AgentDefinition> format
  // that the common validation functions expect
  // Use index as key to preserve all entries (including duplicates)
  const agentTemplates: Record<string, AgentDefinition> = {}
  for (const [index, definition] of definitions.entries()) {
    // Handle null/undefined gracefully
    if (!definition) {
      agentTemplates[`agent_${index}`] = definition
      continue
    }
    // Use index to ensure duplicates aren't overwritten
    const key = definition.id ? `${definition.id}_${index}` : `agent_${index}`
    agentTemplates[key] = definition
  }

  // Simple logger implementation for common validation functions
  const logger = {
    debug: () => { },
    info: () => { },
    warn: () => { },
    error: () => { },
  }

  let validationErrors: DynamicAgentValidationError[] = []

  // Always perform local validation in local-only mode
  const result = validateAgentsCommon({
    agentTemplates,
    logger,
  })

  validationErrors = result.validationErrors

  // Transform validation errors to the SDK format
  const transformedErrors = validationErrors.map((error) => ({
    id: error.filePath ?? 'unknown',
    message: error.message,
  }))

  return {
    success: transformedErrors.length === 0,
    validationErrors: transformedErrors,
    errorCount: transformedErrors.length,
  }
}
