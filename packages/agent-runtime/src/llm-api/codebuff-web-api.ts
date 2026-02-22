import { encode } from 'gpt-tokenizer'

import type { ClientEnv, CiEnv } from '@codebuff/common/types/contracts/env'
import type { Logger } from '@codebuff/common/types/contracts/logger'

interface CodebuffWebApiEnv {
  clientEnv: ClientEnv
  ciEnv: CiEnv
}

export async function callWebSearchAPI(params: any): Promise<{ error: string }> {
  return { error: 'Web search is not available in local-only mode.' }
}

export async function callDocsSearchAPI(params: any): Promise<{ error: string }> {
  return { error: 'Docs search is not available in local-only mode.' }
}

export async function callTokenCountAPI(params: {
  messages: any[]
  system?: string
  logger: Logger
}): Promise<{ inputTokens: number }> {
  const { messages, system } = params

  let textToTokenize = system ?? ''
  for (const msg of messages) {
    if (typeof msg.content === 'string') {
      textToTokenize += msg.content
    } else if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === 'text') {
          textToTokenize += part.text
        }
      }
    }
  }

  try {
    const tokens = encode(textToTokenize)
    return { inputTokens: tokens.length }
  } catch (e) {
    // Fallback to rough estimate if tokenizer fails
    return { inputTokens: Math.ceil(textToTokenize.length / 4) }
  }
}
