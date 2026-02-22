import {
  PLACEHOLDER,
  type SecretAgentDefinition,
} from '../../types/secret-agent-definition'

export const createBestOfNSelector2 = (): Omit<SecretAgentDefinition, 'id'> => {
  return {
    model: 'deepseek-coder',
    displayName: 'Best-of-N Diff Selector',
    spawnerPrompt:
      'Analyzes multiple implementation proposals (as unified diffs) and selects the best one',

    includeMessageHistory: true,
    inheritParentSystemPrompt: true,

    toolNames: ['set_output'],
    spawnableAgents: [],

    inputSchema: {
      params: {
        type: 'object',
        properties: {
          implementations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                strategy: { type: 'string' },
                content: { type: 'string', description: 'Unified diff of the proposed changes' },
              },
              required: ['id', 'content'],
            },
          },
        },
        required: ['implementations'],
      },
    },
    outputMode: 'structured_output',
    outputSchema: {
      type: 'object',
      properties: {
        implementationId: {
          type: 'string',
          description: 'The id of the chosen implementation',
        },
        reason: {
          type: 'string',
          description:
            'An extremely short (1 sentence) description of why this implementation was chosen',
        },
        suggestedImprovements: {
          type: 'string',
          description:
            'A summary of suggested improvements from non-chosen implementations. Leave empty if no valuable improvements were found.',
        },
      },
      required: ['implementationId', 'reason', 'suggestedImprovements'],
    },

    instructionsPrompt: `As part of the best-of-n workflow of agents, you are the implementation selector agent.
  
## Task Instructions

You have been provided with multiple implementation proposals via params. Each implementation shows a UNIFIED DIFF of the proposed changes.

Your task is to:
1. Analyze each implementation's diff carefully, compare them against the original user requirements
2. Select the best implementation
3. Identify the best ideas/techniques from the NON-CHOSEN implementations that could improve the selected implementation

## User Request

For context, here is the original user request again:
<user_message>
${PLACEHOLDER.USER_INPUT_PROMPT}
</user_message>

## Response Format

Use <think> tags to write out your thoughts about the implementations as needed to pick the best implementation. Then, do not write any other explanations AT ALL. You should directly output a single tool call to set_output with the selected implementationId, short reason, and suggestedImprovements string.`,
  }
}

const definition: SecretAgentDefinition = {
  ...createBestOfNSelector2(),
  id: 'best-of-n-selector2',
}

export default definition
