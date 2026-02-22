export async function callLocalModel(prompt: string) {
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek-coder", // or your quantized version
      prompt,
      stream: false
    })
  });
  if (!response.ok) throw new Error("Local LLM Error: " + response.statusText);
  const data = await response.json();
  return data.response;
}
