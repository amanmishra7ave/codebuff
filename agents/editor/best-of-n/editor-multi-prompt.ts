import type { AgentStepContext, ToolCall } from '../../types/agent-definition'
import type { SecretAgentDefinition } from '../../types/secret-agent-definition'

/**
 * Creates a multi-prompt editor agent that spawns one implementor per prompt.
 * Each prompt specifies a slightly different implementation strategy/approach.
 * Uses propose_* tools to draft changes, then applies the chosen implementation.
 */
export function createMultiPromptEditor(): Omit<SecretAgentDefinition, 'id'> {
  return {
    model: 'deepseek-coder',
    displayName: 'Multi-Prompt Editor',
    spawnerPrompt:
      'Edits code by spawning multiple implementor agents with different strategy prompts, selects the best implementation, and applies the changes. Pass as input an array of short prompts specifying different implementation approaches or strategies.',

    includeMessageHistory: true,
    inheritParentSystemPrompt: true,

    toolNames: [
      'spawn_agents',
      'str_replace',
      'write_file',
      'set_messages',
      'set_output',
    ],
    spawnableAgents: [
      'best-of-n-selector2',
      'editor-implementor',
    ],

    inputSchema: {
      params: {
        type: 'object',
        properties: {
          prompts: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Array of short prompts, each specifying a slightly different implementation strategy or approach.',
          },
        },
        required: ['prompts'],
      },
    },
    outputMode: 'structured_output',

    handleSteps: handleStepsMultiPrompt,
  }
}

function* handleStepsMultiPrompt({
  agentState,
  params,
}: AgentStepContext): ReturnType<
  NonNullable<SecretAgentDefinition['handleSteps']>
> {
  const prompts = (params?.prompts as string[] | undefined) ?? []

  if (prompts.length === 0) {
    yield {
      toolName: 'set_output',
      input: {
        error: 'No prompts provided.',
      },
    } satisfies ToolCall<'set_output'>
    return
  }

  const { messageHistory: initialMessageHistory } = agentState
  let userMessageIndex = initialMessageHistory.length

  while (userMessageIndex > 0) {
    const message = initialMessageHistory[userMessageIndex - 1]
    if (message.role === 'user') {
      userMessageIndex--
    } else {
      break
    }
  }
  const updatedMessageHistory = initialMessageHistory.slice(0, userMessageIndex)
  yield {
    toolName: 'set_messages',
    input: {
      messages: updatedMessageHistory,
    },
    includeToolCall: false,
  } satisfies ToolCall<'set_messages'>

  // Spawn one implementor per prompt
  const implementorAgents: { agent_type: string; prompt?: string }[] =
    prompts.map((prompt) => ({
      agent_type: 'editor-implementor',
      prompt: `Strategy: ${prompt}`,
    }))

  const { toolResult: implementorResults } = yield {
    toolName: 'spawn_agents',
    input: {
      agents: implementorAgents,
    },
    includeToolCall: false,
  } satisfies ToolCall<'spawn_agents'>

  const spawnedImplementations = extractSpawnResults<{
    toolCalls: { toolName: string; input: any }[]
    toolResults: any[]
    unifiedDiffs: string
  }>(implementorResults)

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const implementations = spawnedImplementations.map((result, index) => {
    if (!result || (typeof result === 'object' && 'errorMessage' in result)) {
      return {
        id: letters[index],
        strategy: prompts[index] ?? 'unknown',
        content: `Error: ${(result as any)?.errorMessage ?? 'Unknown error'}`,
        toolCalls: [] as { toolName: string; input: any }[],
      }
    }

    return {
      id: letters[index],
      strategy: prompts[index] ?? 'unknown',
      content: result.unifiedDiffs || 'No changes proposed',
      toolCalls: result.toolCalls ?? [],
    }
  })

  // Spawn selector
  const { toolResult: selectorResult } = yield {
    toolName: 'spawn_agents',
    input: {
      agents: [
        {
          agent_type: 'best-of-n-selector2',
          params: {
            implementations: implementations.map((impl) => ({
              id: impl.id,
              strategy: impl.strategy,
              content: impl.content,
            })),
          },
        },
      ],
    },
    includeToolCall: false,
  } satisfies ToolCall<'spawn_agents'>

  const selectorOutput = extractSpawnResults<{
    implementationId: string
    reason: string
    suggestedImprovements: string
  }>(selectorResult)[0]

  if (!selectorOutput || !('implementationId' in selectorOutput)) {
    yield {
      toolName: 'set_output',
      input: { error: 'Selector failed' },
    } satisfies ToolCall<'set_output'>
    return
  }

  const { implementationId } = selectorOutput
  const chosenImplementation = implementations.find(
    (implementation) => implementation.id === implementationId,
  )

  if (!chosenImplementation) {
    yield {
      toolName: 'set_output',
      input: {
        error: `Failed to find chosen implementation: ${implementationId}`,
      },
    } satisfies ToolCall<'set_output'>
    return
  }

  const appliedToolResults: any[] = []
  for (const toolCall of chosenImplementation.toolCalls) {
    const realToolName =
      toolCall.toolName === 'propose_str_replace'
        ? 'str_replace'
        : toolCall.toolName === 'propose_write_file'
          ? 'write_file'
          : toolCall.toolName

    if (realToolName === 'str_replace' || realToolName === 'write_file') {
      const { toolResult } = yield {
        toolName: realToolName,
        input: toolCall.input,
        includeToolCall: true,
      } satisfies ToolCall<'str_replace'> | ToolCall<'write_file'>

      appliedToolResults.push(toolResult)
    }
  }

  yield {
    toolName: 'set_output',
    input: {
      chosenStrategy: chosenImplementation.strategy,
      reason: selectorOutput.reason,
      toolResults: appliedToolResults,
      suggestedImprovements: selectorOutput.suggestedImprovements,
    },
    includeToolCall: false,
  } satisfies ToolCall<'set_output'>

  function extractSpawnResults<T>(results: any[] | undefined): T[] {
    if (!results || results.length === 0) return []

    const jsonResult = results.find((r) => r.type === 'json')
    if (!jsonResult?.value) return []

    const spawnedResults = Array.isArray(jsonResult.value)
      ? jsonResult.value
      : [jsonResult.value]

    return spawnedResults
      .map((result: any) => result?.value)
      .map((result: any) =>
        result && 'value' in result ? result.value : result,
      )
      .filter(Boolean)
  }
}

const definition = {
  ...createMultiPromptEditor(),
  id: 'editor-multi-prompt',
}
export default definition
