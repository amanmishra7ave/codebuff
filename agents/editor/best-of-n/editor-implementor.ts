import type { SecretAgentDefinition } from '../../types/secret-agent-definition'

export const createBestOfNImplementor = (): Omit<SecretAgentDefinition, 'id'> => {
  return {
    model: 'deepseek-coder',
    displayName: 'Implementation Generator',
    spawnerPrompt:
      'Generates a complete implementation using propose_* tools that draft changes without applying them',

    includeMessageHistory: true,
    inheritParentSystemPrompt: true,

    toolNames: ['propose_write_file', 'propose_str_replace'],
    spawnableAgents: [],

    inputSchema: {},
    outputMode: 'structured_output',

    instructionsPrompt: `You are an expert code editor with deep understanding of software engineering principles. You were spawned to generate an implementation for the user's request.
    
Your task is to write out ALL the code changes needed to complete the user's request.

IMPORTANT: Use propose_str_replace and propose_write_file tools to make your edits. These tools draft changes without actually applying them - they will be reviewed first. DO NOT use any other tools. Do not spawn any agents, read files, or set output.

You can make multiple tool calls across multiple steps to complete the implementation. Only the file changes will be passed on, so you can say whatever you want to help you think. Do not write any final summary as that would be a waste of tokens because no one is reading it.

<think>
[ Long think about the best way to implement the changes ]
</think>

<codebuff_tool_call>
{
  "cb_tool_name": "propose_str_replace",
  "path": "path/to/file",
  "replacements": [
    {
      "old": "exact old code",
      "new": "exact new code"
    }
  ]
}
</codebuff_tool_call>

Your implementation should:
- Be complete and comprehensive
- Include all necessary changes to fulfill the user's request
- Follow the project's conventions and patterns

Write out your complete implementation now. Do not write any final summary.`,

    handleSteps: function* ({ agentState: initialAgentState }) {
      const initialMessageHistoryLength =
        initialAgentState.messageHistory.length

      const { agentState } = yield 'STEP_ALL'

      const postMessages = agentState.messageHistory.slice(
        initialMessageHistoryLength,
      )

      const toolCalls: { toolName: string; input: any }[] = []
      for (const message of postMessages) {
        if (message.role !== 'assistant' || !Array.isArray(message.content))
          continue
        for (const part of message.content) {
          if (part.type === 'tool-call') {
            toolCalls.push({
              toolName: part.toolName,
              input: part.input ?? (part as any).args ?? {},
            })
          }
        }
      }

      const toolResults: any[] = []
      for (const message of postMessages) {
        if (message.role !== 'tool' || !Array.isArray(message.content)) continue
        for (const part of message.content) {
          if (part.type === 'json' && part.value) {
            toolResults.push(part.value)
          }
        }
      }

      const unifiedDiffs = toolResults
        .filter((result: any) => result.unifiedDiff)
        .map((result: any) => `--- ${result.file} ---\n${result.unifiedDiff}`)
        .join('\n\n')

      yield {
        toolName: 'set_output',
        input: {
          toolCalls,
          toolResults,
          unifiedDiffs,
        },
        includeToolCall: false,
      }
    },
  }
}
const definition = {
  ...createBestOfNImplementor(),
  id: 'editor-implementor',
}
export default definition
