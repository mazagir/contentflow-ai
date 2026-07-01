import OpenAI from "openai";

export function createAIClient() {
  const geminiKey = process.env.GEMINI_API_KEY;
  const deepseekKey = process.env.DEEPSEEK_API_KEY;

  if (geminiKey) {
    return {
      client: new OpenAI({
        apiKey: geminiKey,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      }),
      model: "gemini-2.5-flash",
    };
  }

  if (deepseekKey) {
    return {
      client: new OpenAI({
        apiKey: deepseekKey,
        baseURL: "https://api.deepseek.com",
      }),
      model: "deepseek-chat",
    };
  }

  throw new Error(
    "Falta configurar una clave de API (GEMINI_API_KEY o DEEPSEEK_API_KEY) en el archivo .env"
  );
}

export async function generateContent(systemPrompt: string): Promise<string> {
  const { client, model } = createAIClient();

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Genera el contenido ahora." },
    ],
    temperature: 0.8,
    max_tokens: 2000,
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
}
