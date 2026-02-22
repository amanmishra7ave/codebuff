import { promptAborted, promptSuccess } from '@codebuff/common/util/error'
import { convertCbToModelMessages } from '@codebuff/common/util/messages'

import type {
  PromptAiSdkFn,
  PromptAiSdkStreamFn,
  PromptAiSdkStructuredInput,
  PromptAiSdkStructuredOutput,
} from '@codebuff/common/types/contracts/llm'
import type { ParamsOf } from '@codebuff/common/types/function-params'

async function* callLLMStream(messages: any[]) {
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'deepseek-coder',
      messages,
      stream: true,
    }),
  });

  if (response.status === 404) {
    throw new Error('Model "deepseek-coder" not found in Ollama. Run: ollama pull deepseek-coder');
  }

  if (!response.ok) {
    throw new Error('Ollama returned an error: ' + response.statusText);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Failed to get response body reader');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const json = JSON.parse(line);
        if (json.message?.content) {
          yield json.message.content;
        }
        if (json.done) return;
      } catch (e) {
        console.error('Failed to parse Ollama stream line:', line);
      }
    }
  }
}

async function callLLM(messages: any[]) {
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'deepseek-coder',
      messages,
      stream: false,
    }),
  });

  if (response.status === 404) {
    throw new Error('Model "deepseek-coder" not found in Ollama. Run: ollama pull deepseek-coder');
  }

  if (!response.ok) {
    throw new Error('Ollama returned an error: ' + response.statusText);
  }

  const data = await response.json();
  return data.message.content;
}

function convertToOllamaMessages(params: any): any[] {
  const messages = convertCbToModelMessages(params)
  return messages.map(m => {
    let content = ''
    if (typeof m.content === 'string') {
      content = m.content
    } else if (Array.isArray(m.content)) {
      content = m.content.map((c: any) => c.text || '').join('')
    }
    return {
      role: m.role.toLowerCase() === 'system' ? 'system' : (m.role.toLowerCase() === 'assistant' ? 'assistant' : 'user'),
      content: content
    }
  })
}

export async function* promptAiSdkStream(
  params: ParamsOf<PromptAiSdkStreamFn>,
): ReturnType<PromptAiSdkStreamFn> {
  if (params.signal.aborted) {
    return promptAborted('User cancelled input')
  }

  const messages = convertToOllamaMessages(params)

  for await (const chunk of callLLMStream(messages)) {
    yield {
      type: 'text',
      text: chunk,
    }
  }

  return promptSuccess('ollama-response')
}

export async function promptAiSdk(
  params: ParamsOf<PromptAiSdkFn>,
): ReturnType<PromptAiSdkFn> {
  if (params.signal.aborted) {
    return promptAborted('User cancelled input')
  }

  const messages = convertToOllamaMessages(params)
  const response = await callLLM(messages)

  return promptSuccess(response)
}

export async function promptAiSdkStructured<T>(
  params: PromptAiSdkStructuredInput<T>,
): PromptAiSdkStructuredOutput<T> {
  if (params.signal.aborted) {
    return promptAborted('User cancelled input')
  }

  const messages = convertToOllamaMessages(params)
  // Append instruction for JSON
  const lastMsg = messages[messages.length - 1]
  if (lastMsg) {
    lastMsg.content += '\n\nOutput only a valid JSON object matching the requested schema.'
  }

  const response = await callLLM(messages)

  try {
    const json = JSON.parse(response)
    return promptSuccess(json)
  } catch (e) {
    // If it's not valid JSON, try to extract it
    const match = response.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        const json = JSON.parse(match[0])
        return promptSuccess(json)
      } catch (e2) {
        throw new Error('Failed to parse structured output from Ollama: ' + response)
      }
    }
    throw new Error('Failed to parse structured output from Ollama: ' + response)
  }
}
