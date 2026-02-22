import { cloneDeep, has, isEqual } from 'lodash'

import type { Logger } from '../types/contracts/logger'
import type { JSONValue } from '../types/json'
import type {
  AssistantMessage,
  AuxiliaryMessageData,
  Message,
  SystemMessage,
  ToolMessage,
  UserMessage,
} from '../types/messages/codebuff-message'
import type { ToolResultOutput } from '../types/messages/content-part'

export type ModelMessage = any

export function toContentString(msg: ModelMessage): string {
  const { content } = msg
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((item) =>
        item && 'text' in item && typeof item.text === 'string' ? item.text : '',
      )
      .join('\n')
  }
  return ''
}

export function withCacheControl<T>(obj: T): T {
  return obj
}

export function withoutCacheControl<T>(obj: T): T {
  return obj
}

type ModelMessageWithAuxiliaryData = any

function assistantToCodebuffMessage(
  message: Omit<AssistantMessage, 'content'> & {
    content: Exclude<AssistantMessage['content'], string>[number]
  },
): AssistantMessage {
  return cloneDeep({ ...message, content: [message.content] })
}

function convertToolResultMessage(
  message: ToolMessage,
): ModelMessageWithAuxiliaryData[] {
  return message.content.map((c) => {
    if (c.type === 'json') {
      return cloneDeep({
        ...message,
        role: 'tool',
        content: [{ ...message, output: c, type: 'tool-result' }],
      })
    }
    if (c.type === 'media') {
      return cloneDeep({
        ...message,
        role: 'user',
        content: [{ type: 'file', data: c.data, mediaType: c.mediaType }],
      })
    }
    throw new Error(`Invalid tool output type: ${(c as any).type}`)
  })
}

function convertToolMessage(message: Message): ModelMessageWithAuxiliaryData[] {
  if (message.role === 'system') {
    return [
      {
        ...message,
        content: message.content.map(({ text }) => text).join('\n\n'),
      },
    ]
  }
  if (message.role === 'user') {
    return [cloneDeep(message)]
  }
  if (message.role === 'assistant') {
    if (typeof message.content === 'string') {
      return [
        cloneDeep({
          ...message,
          content: [{ type: 'text' as const, text: message.content }],
        }),
      ]
    }
    return message.content.map((c) => {
      return assistantToCodebuffMessage({
        ...message,
        content: c,
      })
    })
  }
  if (message.role === 'tool') {
    return convertToolResultMessage(message)
  }
  throw new Error(`Invalid message role: ${(message as any).role}`)
}

function convertToolMessages(
  messages: Message[],
): ModelMessageWithAuxiliaryData[] {
  const result: ModelMessageWithAuxiliaryData[] = []
  for (const message of messages) {
    result.push(...convertToolMessage(message))
  }
  return result
}

export function convertCbToModelMessages({
  messages,
}: {
  messages: Message[]
  includeCacheControl?: boolean
  logger?: Logger
}): ModelMessage[] {
  const toolMessagesConverted = convertToolMessages(messages)

  const aggregated: ModelMessageWithAuxiliaryData[] = []
  for (const message of toolMessagesConverted) {
    if (aggregated.length === 0) {
      aggregated.push(message)
      continue
    }

    const lastMessage = aggregated[aggregated.length - 1]
    if (
      lastMessage.timeToLive !== message.timeToLive ||
      !isEqual(lastMessage.providerOptions, message.providerOptions) ||
      !isEqual(lastMessage.tags, message.tags)
    ) {
      aggregated.push(message)
      continue
    }
    if (lastMessage.role === 'system' && message.role === 'system') {
      lastMessage.content += '\n\n' + message.content
      continue
    }
    if (lastMessage.role === 'user' && message.role === 'user') {
      lastMessage.content.push(...message.content)
      continue
    }
    if (lastMessage.role === 'assistant' && message.role === 'assistant') {
      lastMessage.content.push(...message.content)
      continue
    }

    aggregated.push(message)
  }

  return aggregated
}

export type SystemContent =
  | string
  | SystemMessage['content'][number]
  | SystemMessage['content']

export function systemContent(
  content: SystemContent,
): SystemMessage['content'] {
  if (typeof content === 'string') {
    return [{ type: 'text', text: content }]
  }
  if (Array.isArray(content)) {
    return content
  }
  return [content]
}

export function systemMessage(
  params:
    | SystemContent
    | ({
      content: SystemContent
    } & Omit<SystemMessage, 'role' | 'content'>),
): SystemMessage {
  if (typeof params === 'object' && 'content' in params) {
    return {
      ...params,
      role: 'system',
      content: systemContent(params.content),
    }
  }
  return {
    role: 'system',
    content: systemContent(params),
  }
}

export type UserContent =
  | string
  | UserMessage['content'][number]
  | UserMessage['content']

export function userContent(content: UserContent): UserMessage['content'] {
  if (typeof content === 'string') {
    return [{ type: 'text', text: content }]
  }
  if (Array.isArray(content)) {
    return content
  }
  return [content]
}

export function userMessage(
  params:
    | UserContent
    | ({
      content: UserContent
    } & Omit<UserMessage, 'role' | 'content'>),
): UserMessage {
  if (typeof params === 'object' && 'content' in params) {
    return {
      ...params,
      role: 'user',
      content: userContent(params.content),
      sentAt: Date.now(),
    }
  }
  return {
    role: 'user',
    content: userContent(params),
    sentAt: Date.now(),
  }
}

export type AssistantContent =
  | string
  | AssistantMessage['content'][number]
  | AssistantMessage['content']

export function assistantContent(
  content: AssistantContent,
): AssistantMessage['content'] {
  if (typeof content === 'string') {
    return [{ type: 'text', text: content }]
  }
  if (Array.isArray(content)) {
    return content
  }
  return [content]
}

export function assistantMessage(
  params:
    | AssistantContent
    | ({
      content: AssistantContent
    } & Omit<AssistantMessage, 'role' | 'content'>),
): AssistantMessage {
  if (typeof params === 'object' && 'content' in params) {
    return {
      ...params,
      role: 'assistant',
      content: assistantContent(params.content),
      sentAt: Date.now(),
    }
  }
  return {
    role: 'assistant',
    content: assistantContent(params),
    sentAt: Date.now(),
  }
}

export function jsonToolResult<T extends JSONValue>(
  value: T,
): [
    Extract<ToolResultOutput, { type: 'json' }> & {
      value: T
    },
  ] {
  return [
    {
      type: 'json',
      value,
    },
  ]
}

export function mediaToolResult(params: {
  data: string
  mediaType: string
}): [Extract<ToolResultOutput, { type: 'media' }>] {
  const { data, mediaType } = params
  return [
    {
      type: 'media',
      data,
      mediaType,
    },
  ]
}
