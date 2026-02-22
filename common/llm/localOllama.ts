// common/llm/localOllama.ts

export async function queryMistral(prompt: string): Promise<string> {
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mistral",
      prompt: prompt,
      stream: false,
      temperature: 0.2
    }),
  });

  const data = await response.json();
  return data.response;
}
