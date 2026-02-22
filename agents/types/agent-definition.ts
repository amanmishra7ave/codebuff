/**
 * Codebuff Agent Type Definitions
 *
 * This file provides TypeScript type definitions for creating custom Codebuff agents.
 * Import these types in your agent files to get full type safety and IntelliSense.
 *
 * Usage in .agents/your-agent.ts:
 *   import { AgentDefinition, ToolName, ModelName } from './types/agent-definition'
 *
 *   const definition: AgentDefinition = {
 *     // ... your agent configuration with full type safety ...
 *   }
 *
 *   export default definition
 */

// ============================================================================
// Agent Definition and Utility Types
// ============================================================================

export interface AgentDefinition {
  /** Unique identifier for this agent. Must contain only lowercase letters, numbers, and hyphens, e.g. 'code-reviewer' */
  id: string

  /** Version string (if not provided, will default to '0.0.1' and be bumped on each publish) */
  version?: string

  /** Human-readable name for the agent */
  displayName: string

  /** AI model to use for this agent. */
  model: ModelName

  // ============================================================================
  // Tools and Subagents
  // ============================================================================

  /** MCP servers by name. Names cannot contain `/`. */
  mcpServers?: Record<string, MCPConfig>

  /**
   * Tools this agent can use.
   *
   * By default, all tools are available from any specified MCP server. In
   * order to limit the tools from a specific MCP server, add the tool name(s)
   * in the format `'mcpServerName/toolName1'`, `'mcpServerName/toolName2'`,
   * etc.
   */
  toolNames?: (ToolName | (string & {}))[]

  /** Other agents this agent can spawn, like 'codebuff/file-picker@0.0.1'.
   *
   * Use the fully qualified agent id from the agent store, including publisher and version: 'codebuff/file-picker@0.0.1'
   * (publisher and version are required!)
   *
   * Or, use the agent id from a local agent file in your .agents directory: 'file-picker'.
   */
  spawnableAgents?: string[]

  // ============================================================================
  // Input and Output
  // ============================================================================

  /** The input schema required to spawn the agent. Provide a prompt string and/or a params object or none.
   * 80% of the time you want just a prompt string with a description:
   * inputSchema: {
   *   prompt: { type: 'string', description: 'A description of what info would be helpful to the agent' }
   * }
   */
  inputSchema?: {
    prompt?: { type: 'string'; description?: string }
    params?: JsonObjectSchema
  }

  /** How the agent should output a response to its parent (defaults to 'last_message')
   *
   * last_message: The last message from the agent, typically after using tools.
   *
   * all_messages: All messages from the agent, including tool calls and results.
   *
   * structured_output: Make the agent output a JSON object. Can be used with outputSchema or without if you want freeform json output.
   */
  outputMode?: 'last_message' | 'all_messages' | 'structured_output'

  /** JSON schema for structured output (when outputMode is 'structured_output') */
  outputSchema?: JsonObjectSchema

  // ============================================================================
  // Prompts
  // ============================================================================

  /** Prompt for when and why to spawn this agent. Include the main purpose and use cases.
   *
   * This field is key if the agent is intended to be spawned by other agents. */
  spawnerPrompt?: string

  /** Whether to include conversation history from the parent agent in context.
   *
   * Defaults to false.
   * Use this when the agent needs to know all the previous messages in the conversation.
   */
  includeMessageHistory?: boolean

  /** Whether to inherit the parent agent's system prompt instead of using this agent's own systemPrompt.
   *
   * Defaults to false.
   * Use this when you want to enable prompt caching by preserving the same system prompt prefix.
   * Cannot be used together with the systemPrompt field.
   */
  inheritParentSystemPrompt?: boolean

  /** Background information for the agent. Fairly optional. Prefer using instructionsPrompt for agent instructions. */
  systemPrompt?: string

  /** Instructions for the agent.
   *
   * IMPORTANT: Updating this prompt is the best way to shape the agent's behavior.
   * This prompt is inserted after each user input. */
  instructionsPrompt?: string

  /** Prompt inserted at each agent step.
   *
   * Powerful for changing the agent's behavior, but usually not necessary for smart models.
   * Prefer instructionsPrompt for most instructions. */
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

  /** The agent's conversation history: messages from the user and the assistant. */
  messageHistory: Message[]

  /** The last value set by the set_output tool. This is a plain object or undefined if not set. */
  output: Record<string, any> | undefined

  /** The system prompt for this agent. */
  systemPrompt: string

  /** The tool definitions for this agent. */
  toolDefinitions: Record<
    string,
    { description: string | undefined; inputSchema: {} }
  >

  /**
   * The token count.
   */
  contextTokenCount: number
}

/**
 * Context provided to handleSteps generator function
 */
export interface AgentStepContext {
  agentState: AgentState
  prompt?: string
  params?: Record<string, any>
  logger: Logger
}

export type StepText = { type: 'STEP_TEXT'; text: string }
export type GenerateN = { type: 'GENERATE_N'; n: number }

/**
 * Tool call object for handleSteps generator
 */
export type ToolCall<T extends ToolName = ToolName> = {
  [K in T]: {
    toolName: K
    input: GetToolParams<K>
    includeToolCall?: boolean
  }
}[T]

// ============================================================================
// Available Tools
// ============================================================================

/**
 * File operation tools
 */
export type FileEditingTools = 'read_files' | 'write_file' | 'str_replace'

/**
 * Code analysis tools
 */
export type CodeAnalysisTools = 'code_search' | 'find_files' | 'read_files'

/**
 * Terminal and system tools
 */
export type TerminalTools = 'run_terminal_command' | 'code_search'

/**
 * Web and browser tools
 */
export type WebTools = 'web_search' | 'read_docs'

/**
 * Agent management tools
 */
export type AgentTools = 'spawn_agents'

/**
 * Output and control tools
 */
export type OutputTools = 'set_output'

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
