import { globalStopSequence } from './constants'

import type { AgentTemplate } from './templates/types'
import type { TrackEventFn } from '@codebuff/common/types/contracts/analytics'
import type { SendActionFn } from '@codebuff/common/types/contracts/client'
import type { PromptAiSdkStreamFn } from '@codebuff/common/types/contracts/llm'
import type { Logger } from '@codebuff/common/types/contracts/logger'
import type { ParamsOf } from '@codebuff/common/types/function-params'
import type { Message } from '@codebuff/common/types/messages/codebuff-message'

export const getAgentStreamFromTemplate = (params: {
  agentId?: string
  apiKey: string
  clientSessionId: string
  costMode?: string
  fingerprintId: string
  includeCacheControl?: boolean
  localAgentTemplates: Record<string, AgentTemplate>
  logger: Logger
  messages: Message[]
  runId: string
  signal: AbortSignal
  template: AgentTemplate
  tools: any
  userId: string | undefined
  userInputId: string

  onCostCalculated?: (credits: number) => Promise<void>
  promptAiSdkStream: PromptAiSdkStreamFn
  sendAction: SendActionFn
  trackEvent: TrackEventFn
}): ReturnType<PromptAiSdkStreamFn> => {
  const {
    agentId,
    apiKey,
    clientSessionId,
    costMode,
    fingerprintId,
    includeCacheControl,
    localAgentTemplates,
    logger,
    messages,
    runId,
    template,
    tools,
    userId,
    userInputId,

    sendAction,
    onCostCalculated,
    promptAiSdkStream,
    trackEvent,
  } = params

  if (!template) {
    throw new Error('Agent template is null/undefined')
  }

  const { model } = template

  const aiSdkStreamParams: ParamsOf<PromptAiSdkStreamFn> = {
    agentId,
    apiKey,
    clientSessionId,
    costMode,
    fingerprintId,
    includeCacheControl,
    logger,
    localAgentTemplates,
    maxOutputTokens: 32_000,
    maxRetries: 3,
    messages,
    model,
    runId,
    signal: params.signal,
    spawnableAgents: template.spawnableAgents,
    stopSequences: [globalStopSequence],
    tools,
    userId,
    userInputId,

    onCostCalculated,
    sendAction,
    trackEvent,
  }

    // Pass agent's provider routing options to SDK
    ; (aiSdkStreamParams as any).agentProviderOptions = template.providerOptions

  return promptAiSdkStream(aiSdkStreamParams)
}
