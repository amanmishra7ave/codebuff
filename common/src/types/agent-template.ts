/**
 * Backend Agent Template Types
 *
 * This file provides backend-compatible agent template types with strict validation.
 * It imports base types from the user-facing template to eliminate duplication.
 */

import { z } from 'zod'

import type { MCPConfig } from './mcp'
import type { Model } from '../old-constants'
import type { ToolResultOutput } from './messages/content-part'
import type { AgentState, AgentTemplateType } from './session-state'
import type {
  ToolCall,
  AgentState as PublicAgentState,
} from '../templates/initial-agents-dir/types/agent-definition'
import type { Logger } from '../templates/initial-agents-dir/types/util-types'
import type { ToolName } from '../tools/constants'

export type AgentId = `${string}/${string}@${number}.${number}.${number}`

/**
 * Backend agent template with strict validation and Zod schemas
 * Extends the user-facing AgentDefinition but with backend-specific requirements
 */
export type AgentTemplate<
  P = string | undefined,
  T = Record<string, any> | undefined,
> = {
  id: AgentTemplateType
  displayName: string
  model: Model

  mcpServers: Record<string, MCPConfig>
  toolNames: (ToolName | (string & {}))[]
  spawnableAgents: AgentTemplateType[]

  spawnerPrompt?: string
  systemPrompt: string
  instructionsPrompt: string
  stepPrompt: string
  parentInstructions?: Record<string, string>

  // Required parameters for spawning this agent.
  inputSchema: {
    prompt?: z.ZodSchema<P>
    params?: z.ZodSchema<T>
  }
  includeMessageHistory: boolean
  inheritParentSystemPrompt: boolean
  outputMode: 'last_message' | 'all_messages' | 'structured_output'
  outputSchema?: z.ZodSchema<any>

  handleSteps?: StepHandler<P, T> | string // Function or string of the generator code for running in a sandbox
  // Kept for backward compatibility but unused
  reasoningOptions?: any
  providerOptions?: any
}

export type StepText = { type: 'STEP_TEXT'; text: string }
export type GenerateN = { type: 'GENERATE_N'; n: number }

// Zod schemas for handleSteps yield values
export const StepTextSchema = z.object({
  type: z.literal('STEP_TEXT'),
  text: z.string(),
})

export const GenerateNSchema = z.object({
  type: z.literal('GENERATE_N'),
  n: z.number().int().positive(),
})

export const HandleStepsToolCallSchema = z.object({
  toolName: z.string().min(1),
  input: z.record(z.string(), z.any()),
  includeToolCall: z.boolean().optional(),
})

export const HandleStepsYieldValueSchema = z.union([
  z.literal('STEP'),
  z.literal('STEP_ALL'),
  StepTextSchema,
  GenerateNSchema,
  HandleStepsToolCallSchema,
])

export type HandleStepsYieldValue = z.infer<typeof HandleStepsYieldValueSchema>

export type StepGenerator = Generator<
  Omit<ToolCall, 'toolCallId'> | 'STEP' | 'STEP_ALL' | StepText | GenerateN, // Generic tool call type
  void,
  {
    agentState: PublicAgentState
    toolResult: ToolResultOutput[]
    stepsComplete: boolean
    nResponses?: string[]
  }
>

export type StepHandler<
  P = string | undefined,
  T = Record<string, any> | undefined,
> = (context: {
  agentState: AgentState
  prompt: P
  params: T
  logger: Logger
}) => StepGenerator

export { Logger, PublicAgentState }
