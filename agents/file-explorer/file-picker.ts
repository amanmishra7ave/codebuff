import {
  PLACEHOLDER,
  type SecretAgentDefinition,
} from '../types/secret-agent-definition'

import type { StepText, ToolCall } from '../types/agent-definition'

type FilePickerMode = 'default' | 'max'

export const createFilePicker = (
  mode: FilePickerMode,
): Omit<SecretAgentDefinition, 'id'> => {
  const isMax = mode === 'max'

  return {
    displayName: 'Fletcher the File Fetcher',
    model: 'deepseek-coder',
    spawnerPrompt:
      'Spawn to find relevant files in a codebase related to the prompt. Outputs up to 12 file paths with short summaries for each file.',
    inputSchema: {
      prompt: {
        type: 'string',
        description: 'A description of the files you need to find.',
      },
      params: {
        type: 'object' as const,
        properties: {
          directories: {
            type: 'array' as const,
            items: { type: 'string' as const },
            description:
              'Optional list of paths to directories to look within. If omitted, the entire project tree is used.',
          },
        },
        required: [],
      },
    },
    outputMode: 'last_message',
    includeMessageHistory: false,
    toolNames: ['spawn_agents'],
    spawnableAgents: ['file-lister'],

    systemPrompt: `You are an expert at finding relevant files in a codebase. ${PLACEHOLDER.FILE_TREE_PROMPT}`,
    instructionsPrompt: `Instructions: Provide an extremely short report of the locations in the codebase that could be helpful. Focus on the files that are most relevant to the user prompt.`.trim(),

    handleSteps: isMax ? handleStepsMax : handleStepsDefault,
  }
}

// handleSteps for default mode - spawns 1 file-lister
const handleStepsDefault: SecretAgentDefinition['handleSteps'] = function* ({
  prompt,
  params,
}) {
  const { toolResult: fileListerResults } = yield {
    toolName: 'spawn_agents',
    input: {
      agents: [
        {
          agent_type: 'file-lister',
          prompt: prompt ?? '',
          params: params ?? {},
        },
      ],
    },
  } satisfies ToolCall

  const spawnResults = extractSpawnResults(fileListerResults)

  const allPaths = new Set<string>()
  let hasAnyResults = false

  for (const result of spawnResults) {
    const fileListText = extractLastMessageText(result)
    if (fileListText) {
      hasAnyResults = true
      const paths = fileListText.split('\n').filter(Boolean)
      for (const path of paths) {
        allPaths.add(path)
      }
    }
  }

  if (!hasAnyResults) {
    const errorMessages = spawnResults
      .map(extractErrorMessage)
      .filter(Boolean)
      .join('; ')
    yield {
      type: 'STEP_TEXT',
      text: errorMessages
        ? `Error from file-lister(s): ${errorMessages}`
        : 'Error: Could not extract file list from spawned agent(s)',
    } satisfies StepText
    return
  }

  const paths = Array.from(allPaths)

  yield {
    toolName: 'read_files',
    input: { paths },
  }

  yield 'STEP'

  function extractSpawnResults(results: any[] | undefined): any[] {
    if (!results || results.length === 0) return []
    const jsonResult = results.find((r) => r.type === 'json')
    if (!jsonResult?.value) return []
    const spawnedResults = Array.isArray(jsonResult.value)
      ? jsonResult.value
      : [jsonResult.value]
    return spawnedResults.map((result: any) => result?.value).filter(Boolean)
  }

  function extractLastMessageText(agentOutput: any): string | null {
    if (!agentOutput) return null
    if (
      agentOutput.type === 'lastMessage' &&
      Array.isArray(agentOutput.value)
    ) {
      for (let i = agentOutput.value.length - 1; i >= 0; i--) {
        const message = agentOutput.value[i]
        if (message.role === 'assistant' && Array.isArray(message.content)) {
          for (const part of message.content) {
            if (part.type === 'text' && typeof part.text === 'string') {
              return part.text
            }
          }
        }
      }
    }
    return null
  }

  function extractErrorMessage(agentOutput: any): string | null {
    if (!agentOutput) return null
    if (agentOutput.type === 'error') {
      return agentOutput.message ?? agentOutput.value ?? null
    }
    return null
  }
}

// handleSteps for max mode - spawns 2 file-listers in parallel
const handleStepsMax: SecretAgentDefinition['handleSteps'] = function* ({
  prompt,
  params,
}) {
  const { toolResult: fileListerResults } = yield {
    toolName: 'spawn_agents',
    input: {
      agents: [
        {
          agent_type: 'file-lister',
          prompt: prompt ?? '',
          params: params ?? {},
        },
        {
          agent_type: 'file-lister',
          prompt: prompt ?? '',
          params: params ?? {},
        },
      ],
    },
  } satisfies ToolCall

  const spawnResults = extractSpawnResults(fileListerResults)

  const allPaths = new Set<string>()
  let hasAnyResults = false

  for (const result of spawnResults) {
    const fileListText = extractLastMessageText(result)
    if (fileListText) {
      hasAnyResults = true
      const paths = fileListText.split('\n').filter(Boolean)
      for (const path of paths) {
        allPaths.add(path)
      }
    }
  }

  if (!hasAnyResults) {
    const errorMessages = spawnResults
      .map(extractErrorMessage)
      .filter(Boolean)
      .join('; ')
    yield {
      type: 'STEP_TEXT',
      text: errorMessages
        ? `Error from file-lister(s): ${errorMessages}`
        : 'Error: Could not extract file list from spawned agent(s)',
    } satisfies StepText
    return
  }

  const paths = Array.from(allPaths)

  yield {
    toolName: 'read_files',
    input: { paths },
  }

  yield 'STEP'

  function extractSpawnResults(results: any[] | undefined): any[] {
    if (!results || results.length === 0) return []
    const jsonResult = results.find((r) => r.type === 'json')
    if (!jsonResult?.value) return []
    const spawnedResults = Array.isArray(jsonResult.value)
      ? jsonResult.value
      : [jsonResult.value]
    return spawnedResults.map((result: any) => result?.value).filter(Boolean)
  }

  function extractLastMessageText(agentOutput: any): string | null {
    if (!agentOutput) return null
    if (
      agentOutput.type === 'lastMessage' &&
      Array.isArray(agentOutput.value)
    ) {
      for (let i = agentOutput.value.length - 1; i >= 0; i--) {
        const message = agentOutput.value[i]
        if (message.role === 'assistant' && Array.isArray(message.content)) {
          for (const part of message.content) {
            if (part.type === 'text' && typeof part.text === 'string') {
              return part.text
            }
          }
        }
      }
    }
    return null
  }

  function extractErrorMessage(agentOutput: any): string | null {
    if (!agentOutput) return null
    if (agentOutput.type === 'error') {
      return agentOutput.message ?? agentOutput.value ?? null
    }
    return null
  }
}

const definition: SecretAgentDefinition = {
  id: 'file-picker',
  ...createFilePicker('default'),
}

export default definition
