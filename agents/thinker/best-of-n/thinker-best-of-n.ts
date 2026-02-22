import type {
  AgentStepContext,
  StepText,
  ToolCall,
} from '../../types/agent-definition'
import type { SecretAgentDefinition } from '../../types/secret-agent-definition'

export function createThinkerBestOfN(): Omit<SecretAgentDefinition, 'id'> {
  return {
    model: 'deepseek-coder',
    displayName: 'Best-of-N Thinker',
    spawnerPrompt:
      'Generates deep thinking by orchestrating multiple thinker agents, selects the best thinking output. Use this to help solve a hard problem.',

    includeMessageHistory: true,
    inheritParentSystemPrompt: true,

    toolNames: ['spawn_agents'],
    spawnableAgents: ['thinker-selector'],

    inputSchema: {
      prompt: {
        type: 'string',
        description: 'The problem you are trying to solve.',
      },
      params: {
        type: 'object',
        properties: {
          n: {
            type: 'number',
            description: 'Number of parallel thinker agents to spawn.',
          },
        },
      },
    },
    outputMode: 'last_message',

    instructionsPrompt: `You are one subagent of the thinker-best-of-n agent. Instructions: Use the <think> tag to think deeply about the user request. When satisfied, write out a brief response.`,

    handleSteps: function* ({ params }) {
      const n = Math.min(10, Math.max(1, (params?.n as number | undefined) ?? 3))

      const { nResponses = [] } = yield {
        type: 'GENERATE_N',
        n,
      }

      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      const thoughts = nResponses.map((content, index) => ({
        id: letters[index],
        content: content.replace(/<think>[\s\S]*?<\/think>/g, '').trim(),
      }))

      const { toolResult: selectorResult } = yield {
        toolName: 'spawn_agents',
        input: {
          agents: [
            {
              agent_type: 'thinker-selector',
              params: { thoughts },
            },
          ],
        },
        includeToolCall: false,
      } satisfies ToolCall<'spawn_agents'>

      const selectorOutput = extractSpawnResults<{
        thoughtId: string
      }>(selectorResult)[0]

      if (!selectorOutput || 'errorMessage' in selectorOutput) {
        yield {
          type: 'STEP_TEXT',
          text: (selectorOutput as any)?.errorMessage ?? 'Selector failed',
        } satisfies StepText
        return
      }
      const { thoughtId } = selectorOutput
      const chosenThought = thoughts.find((thought) => thought.id === thoughtId)
      if (!chosenThought) {
        yield {
          type: 'STEP_TEXT',
          text: 'Failed to find chosen thinking output.',
        } satisfies StepText
        return
      }

      yield {
        type: 'STEP_TEXT',
        text: chosenThought.content,
      } satisfies StepText

      function extractSpawnResults<T>(
        results: any[] | undefined,
      ): (T | { errorMessage: string })[] {
        if (!results) return []
        const spawnedResults = results
          .filter((result) => result.type === 'json')
          .map((result) => result.value)
          .flat() as {
            agentType: string
            value: { value?: T; errorMessage?: string }
          }[]
        return spawnedResults.map(
          (result) =>
            result.value.value ??
            ({
              errorMessage:
                result.value.errorMessage ?? 'Error extracting spawn results',
            } as { errorMessage: string }),
        )
      }
    },
  }
}

const definition: SecretAgentDefinition = {
  ...createThinkerBestOfN(),
  id: 'thinker-best-of-n',
}

export default definition
