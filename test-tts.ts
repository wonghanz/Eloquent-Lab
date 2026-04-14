import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  const ttsResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ parts: [{ text: "Hello world" }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Puck' },
        },
      },
    },
  });
  const inlineData = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  console.log("MIME:", inlineData?.mimeType);
  console.log("DATA:", inlineData?.data?.substring(0, 50));
}
run().catch(console.error);
