

import Groq from "groq-sdk";

let groqClient = null;

function getClient() {
  if (!groqClient) {
    const key = process.env.GROQ_API_KEY;
    if (!key || key === "your_groq_api_key_here") {
      throw new Error(
        "GROQ_API_KEY not set!\n" +
        "1. Go to https://console.groq.com\n" +
        "2. Create a free account\n" +
        "3. Copy your API key\n" +
        "4. Paste it into backend/.env as: GROQ_API_KEY=gsk_xxxxx\n" +
        "5. Restart the backend with: npm run dev"
      );
    }
    groqClient = new Groq({ apiKey: key });
  }
  return groqClient;
}


export async function generateArgument(systemPrompt, userPrompt, onChunk) {
  const client = getClient();

  const stream = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 280,
    temperature: 0.85,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt   },
    ],
    stream: true,
  });

  let fullText = "";

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || "";
    if (text) {
      fullText += text;
      onChunk(text);
    }
  }

  return fullText;
}
