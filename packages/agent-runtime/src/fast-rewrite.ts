import { buildArray } from '@codebuff/common/util/array'
import { unwrapPromptResult } from '@codebuff/common/util/error'
import { parseMarkdownCodeBlock } from '@codebuff/common/util/file'
import { assistantMessage, userMessage } from '@codebuff/common/util/messages'
import { generateCompactId } from '@codebuff/common/util/string'

import type { CodebuffToolMessage } from '@codebuff/common/tools/list'
import type { PromptAiSdkFn } from '@codebuff/common/types/contracts/llm'
import type { Logger } from '@codebuff/common/types/contracts/logger'
import type { Message } from '@codebuff/common/types/messages/codebuff-message'

/**
 * Rewrites file content using local LLM.
 */
export async function fastRewrite(
  params: {
    initialContent: string
    editSnippet: string
    filePath: string
    userMessage: string | undefined
    logger: Logger
    promptAiSdk: PromptAiSdkFn
  } & any,
) {
  const { initialContent, editSnippet, filePath, logger } = params
  const startTime = Date.now()
  const messageId = generateCompactId('cb-')

  const response = await rewriteWithLocal(params)

  const duration = Date.now() - startTime

  logger.debug(
    {
      initialContent,
      editSnippet,
      response,
      messageId,
      duration,
    },
    `fastRewrite of ${filePath}`,
  )

  return response
}

/**
 * Rewrites file content using local LLM.
 */
async function rewriteWithLocal(
  params: {
    initialContent?: string
    oldContent?: string
    editSnippet: string
    promptAiSdk: PromptAiSdkFn
  } & any,
): Promise<string> {
  const oldContent = params.initialContent ?? params.oldContent
  const { editSnippet, promptAiSdk } = params
  const prompt = `You are an expert programmer tasked with implementing changes to a file. Please rewrite the file to implement the changes shown in the edit snippet, while preserving the original formatting and behavior of unchanged parts.

Old file content:
\`\`\`
${oldContent}
\`\`\`

Edit snippet (the update to implement):
\`\`\`
${editSnippet}
\`\`\`

Integrate the edit snippet into the old file content to produce one coherent new file.

Important:
1. Preserve the original formatting, indentation, and comments of the old file. Please include all comments from the original file.
2. Only implement the changes shown in the edit snippet
3. Do not include any placeholder comments in your output (like "// ... existing code ..." or "# ... rest of the file ...")

Please output just the complete updated file content with the edit applied and no additional text.`

  return (
    parseMarkdownCodeBlock(
      unwrapPromptResult(
        await promptAiSdk({
          ...params,
          messages: [userMessage(prompt), assistantMessage('```\n')],
          model: 'deepseek-coder',
        }),
      ),
    ) + '\n'
  )
}

export async function rewriteWithOpenAI(params: any): Promise<string> {
  return rewriteWithLocal(params)
}

/**
 * Checks if assistant forgot to add placeholders.
 */
export const shouldAddFilePlaceholders = async (
  params: {
    filePath: string
    oldContent: string
    rewrittenNewContent: string
    messageHistory: Message[]
    fullResponse: string
    logger: Logger
    promptAiSdk: PromptAiSdkFn
  } & any,
) => {
  const {
    filePath,
    oldContent,
    rewrittenNewContent,
    messageHistory,
    fullResponse,
    logger,
    promptAiSdk
  } = params

  const prompt = `
Here's the original file:

\`\`\`
${oldContent}
\`\`\`

And here's the proposed new content for the file:

\`\`\`
${rewrittenNewContent}
\`\`\`

Consider the above information and conversation and answer the following question.
Most likely, the assistant intended to replace the entire original file with the new content. If so, write "REPLACE_ENTIRE_FILE".
In other cases, the assistant forgot to include the rest of the file and just wrote in one section of the file to be edited. Typically this happens if the new content focuses on the change of a single function or section of code with the intention to edit just this section, but keep the rest of the file unchanged.
If you believe this is the scenario, please write "LOCAL_CHANGE_ONLY". Otherwise, write "REPLACE_ENTIRE_FILE".
Do not write anything else.
`.trim()

  const startTime = Date.now()

  const messages = buildArray(
    ...messageHistory,
    fullResponse && assistantMessage(fullResponse),
    userMessage(prompt),
  )
  const response = unwrapPromptResult(await promptAiSdk({
    ...params,
    messages,
    model: 'deepseek-coder' as any,
  })) as string

  const shouldAddPlaceholderComments = response.includes('LOCAL_CHANGE_ONLY')
  logger.debug(
    {
      response,
      shouldAddPlaceholderComments,
      filePath,
      duration: Date.now() - startTime,
    },
    `shouldAddFilePlaceholders response for ${filePath}`,
  )

  return shouldAddPlaceholderComments
}
