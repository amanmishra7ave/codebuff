import { type SecretAgentDefinition } from '../../types/secret-agent-definition'

export function createThinkerSelector(): Omit<SecretAgentDefinition, 'id'> {
  return {
    model: 'deepseek-coder',
    displayName: 'Thinker Output Selector',
    spawnerPrompt: 'Analyzes multiple thinking outputs and selects the best one',

    includeMessageHistory: true,
    inheritParentSystemPrompt: true,

    toolNames: ['set_output'],
    spawnableAgents: [],

    inputSchema: {
      params: {
        type: 'object',
        properties: {
          thoughts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                content: { type: 'string' },
              },
              required: ['id', 'content'],
            },
          },
        },
        required: ['thoughts'],
      },
    },
    outputMode: 'structured_output',
    outputSchema: {
      type: 'object',
      properties: {
        thoughtId: {
          type: 'string',
          description: 'The id of the chosen thinking output',
        },
      },
      required: ['thoughtId'],
    },

    instructionsPrompt: `As part of the best-of-n workflow for thinking agents, you are the thinking selector agent. Your task is to analyze each thinking output carefully and select the best thinking. Evaluate based on depth, correctness, and clarity. Use <think> tags to consider the thinking outputs, then output a single tool call to set_output with the selected thoughtId.`,
  }
}

const definition: SecretAgentDefinition = {
  ...createThinkerSelector(),
  id: 'thinker-selector',
}

export default definition
