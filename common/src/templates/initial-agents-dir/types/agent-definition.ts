/**
 * Codebuff Agent Type Definitions
 *
 * This file provides TypeScript type definitions for creating custom Codebuff agents.
 * Import these types in your agent files to get full type safety and IntelliSense.
 */

// ============================================================================
// Agent Definition and Utility Types
// ============================================================================

export interface AgentDefinition {
  /** Unique identifier for this agent. */
  id: string

  /** Version string */
  version?: string

  /** Human-readable name for the agent */
  displayName: string

  /** AI model to use for this agent. Must be 'deepseek-coder' */
  model: ModelName

  // ============================================================================
  // Tools and Subagents
  // ============================================================================

  /** MCP servers by name. */
  mcpServers?: Record<string, MCPConfig>

  /**
   * Tools this agent can use.
   */
  toolNames?: (ToolName | (string & {}))[]

  /** Other agents this agent can spawn. */
  spawnableAgents?: string[]

  // ============================================================================
  // Input and Output
  // ============================================================================

  /** The input schema required to spawn the agent. */
  inputSchema?: {
    prompt?: { type: 'string'; description?: string }
    params?: JsonObjectSchema
  }

  /** How the agent should output a response to its parent */
  outputMode?: 'last_message' | 'all_messages' | 'structured_output'

  /** JSON schema for structured output */
  outputSchema?: JsonObjectSchema

  // ============================================================================
  // Prompts
  // ============================================================================

  /** Prompt for when and why to spawn this agent. */
  spawnerPrompt?: string

  /** Whether to include conversation history from the parent agent in context. */
  includeMessageHistory?: boolean

  /** Whether to inherit the parent agent's system prompt. */
  inheritParentSystemPrompt?: boolean

  /** Background information for the agent. */
  systemPrompt?: string

  /** Instructions for the agent. */
  instructionsPrompt?: string

  /** Prompt inserted at each agent step. */
  stepPrompt?: string

  // ============================================================================
  // Handle Steps
  // ============================================================================

  /** Programmatically step the agent forward and run tools. */
  handleSteps?: (context: AgentStepContext) => Generator<
    ToolCall | 'STEP' | 'STEP_ALL' | StepText | GenerateN,
    void,
    {
      agentState: AgentState
      toolResult: ToolResultOutput[] | undefined
      stepsComplete: boolean
      nResponses?: string[]
    }
  >
}

// ============================================================================
// Supporting Types
// ============================================================================

export interface AgentState {
  agentId: string
  runId: string
  parentId: string | undefined
  messageHistory: Message[]
  output: Record<string, any> | undefined
  systemPrompt: string
  toolDefinitions: Record<string, { description: string | undefined; inputSchema: {} }>
  contextTokenCount: number
}

export interface AgentStepContext {
  agentState: AgentState
  prompt?: string
  params?: Record<string, any>
  logger: Logger
}

export type StepText = { type: 'STEP_TEXT'; text: string }
export type GenerateN = { type: 'GENERATE_N'; n: number }

export type ToolCall<T extends ToolName = ToolName> = {
  [K in T]: {
    toolName: K
    input: GetToolParams<K>
    includeToolCall?: boolean
  }
}[T]

// ============================================================================
// Available Models
// ============================================================================

export type ModelName = 'deepseek-coder'

import type { ToolName, GetToolParams } from './tools'
import type {
  Message,
  ToolResultOutput,
  JsonObjectSchema,
  MCPConfig,
  Logger,
} from './util-types'

export type { ToolName, GetToolParams }
