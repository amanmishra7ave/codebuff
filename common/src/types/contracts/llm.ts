import type { TrackEventFn } from './analytics'
import type { SendActionFn } from './client'
import type { AgentTemplate } from '../agent-template'
import type { Logger } from './logger'
import type { Model } from '../../old-constants'
import type { Message } from '../messages/codebuff-message'
import type { PromptResult } from '../../util/error'

export type StreamChunk =
  | {
    type: 'text'
    text: string
    agentId?: string
  }
  | {
    type: 'reasoning'
    text: string
  }
  | {
    type: 'tool-call'
    toolCallId: string
    toolName: string
    input: any
  }
  | { type: 'error'; message: string }

export type PromptAiSdkStreamFn = (
  params: {
    apiKey: string
    runId: string
    messages: Message[]
    clientSessionId: string
    fingerprintId: string
    model: Model
    userId: string | undefined
    chargeUser?: boolean
    thinkingBudget?: number
    userInputId: string
    agentId?: string
    maxRetries?: number
    onCostCalculated?: (credits: number) => Promise<void>
    includeCacheControl?: boolean
    agentProviderOptions?: any
    /** List of agents that can be spawned - used to transform agent tool calls */
    spawnableAgents?: string[]
    /** Map of locally available agent templates - used to transform agent tool calls */
    localAgentTemplates?: Record<string, AgentTemplate>
    /** Cost mode - 'free' mode means 0 credits charged for all agents */
    costMode?: string
    sendAction: SendActionFn
    logger: Logger
    trackEvent: TrackEventFn
    signal: AbortSignal
  },
) => AsyncGenerator<StreamChunk, PromptResult<string | null>>

export type PromptAiSdkFn = (
  params: {
    apiKey: string
    runId: string
    messages: Message[]
    clientSessionId: string
    fingerprintId: string
    userInputId: string
    model: Model
    userId: string | undefined
    chargeUser?: boolean
    agentId?: string
    onCostCalculated?: (credits: number) => Promise<void>
    includeCacheControl?: boolean
    agentProviderOptions?: any
    maxRetries?: number
    /** Cost mode - 'free' mode means 0 credits charged for all agents */
    costMode?: string
    sendAction: SendActionFn
    logger: Logger
    trackEvent: TrackEventFn
    n?: number
    signal: AbortSignal
  },
) => Promise<PromptResult<string>>

export type PromptAiSdkStructuredInput<T> = {
  apiKey: string
  runId: string
  messages: Message[]
  schema: any
  clientSessionId: string
  fingerprintId: string
  userInputId: string
  model: Model
  userId: string | undefined
  maxTokens?: number
  temperature?: number
  timeout?: number
  chargeUser?: boolean
  agentId?: string
  onCostCalculated?: (credits: number) => Promise<void>
  includeCacheControl?: boolean
  agentProviderOptions?: any
  maxRetries?: number
  sendAction: SendActionFn
  logger: Logger
  trackEvent: TrackEventFn
  signal: AbortSignal
}
export type PromptAiSdkStructuredOutput<T> = Promise<PromptResult<T>>
export type PromptAiSdkStructuredFn = <T>(
  params: PromptAiSdkStructuredInput<T>,
) => PromptAiSdkStructuredOutput<T>
