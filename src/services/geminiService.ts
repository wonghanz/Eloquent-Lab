import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateTopicFromImage(base64Image: string): Promise<string> {
  try {
    const parts: any[] = [
      { text: 'Analyze this room/environment. Generate a single, thought-provoking debate question related to the objects, setting, or vibe seen in the image. Return ONLY the question. If no image is provided, generate a random interesting debate topic about modern life.' }
    ];

    if (base64Image && base64Image.includes(',')) {
      parts.push({
        inlineData: {
          data: base64Image.split(',')[1],
          mimeType: 'image/jpeg'
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: [
        {
          role: 'user',
          parts: parts
        }
      ]
    });
    return response.text || "Does artificial intelligence hinder human creativity?";
  } catch (error) {
    console.error("Error generating topic:", error);
    return "Does artificial intelligence hinder human creativity? (Fallback)";
  }
}

export async function generateDebateResponse(
  transcript: { speaker: string, text: string }[], 
  persona: string, 
  topic: string,
  isLowCadence: boolean
) {
  const systemInstruction = `You are an English debate examiner acting as the persona: ${persona}.
The debate topic is: "${topic}".
Your goal is to debate the user, test their English proficiency (CEFR/MUET standards), and occasionally challenge them.
If 'isLowCadence' is true, the user is struggling. Simplify your language and be encouraging.
Otherwise, maintain your persona (Skeptic = questioning/doubtful, Aggressor = dominant/challenging, Supporter = agreeing but expanding).
Identify any grammatical errors or weak vocabulary in the user's LATEST turn.
Respond in JSON format:
{
  "response": "Your spoken response to the user",
  "dirtyWords": [{"word": "the exact weak/incorrect word used by user", "correction": "better academic word"}],
  "interruption": boolean (true if you are interrupting them to test their floor-regaining skills)
}`;

  const history = transcript.map(t => ({
    role: t.speaker === 'user' ? 'user' : 'model',
    parts: [{ text: t.text }]
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: history,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error generating debate response:", error);
    return {
      response: "I see. Could you elaborate on that point?",
      dirtyWords: [],
      interruption: false
    };
  }
}

export async function generateSettlement(transcript: { speaker: string, text: string }[]) {
  const systemInstruction = `Analyze the user's performance in this debate based on CEFR/MUET rubrics.
Respond in JSON format:
{
  "scores": {
    "taskFulfilment": number (0-100),
    "language": number (0-100),
    "fluency": number (0-100)
  },
  "band": "e.g., Band 5 / C1"
}`;
  
  const history = transcript.map(t => ({
    role: t.speaker === 'user' ? 'user' : 'model',
    parts: [{ text: t.text }]
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: history,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error generating settlement:", error);
    return {
      scores: { taskFulfilment: 80, language: 70, fluency: 75 },
      band: "Band 4 / B2"
    };
  }
}

export interface StratifiedArticle {
  title: string;
  originalUrl: string;
  paragraphs: {
    id: number;
    text: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    interaction: {
      type: 'synonym' | 'true-false' | 'highlight-bias';
      question: string;
      options?: string[];
      answer: string | boolean;
    };
  }[][]; // Array of paragraphs, each having 3 difficulty versions
}

export async function fetchAndStratifyArticle(): Promise<StratifiedArticle> {
  const systemInstruction = `Pull a recent interesting Malaysian news headline (simulated) and generate a stratified reading experience.
Provide 3 paragraphs. For EACH paragraph, provide 3 versions: Easy (A2/B1), Medium (B2), Hard (C1).
Also, for each paragraph, define a "Comprehension Gate" interaction.

Return ONLY JSON matching this structure:
{
  "title": "string",
  "originalUrl": "string",
  "paragraphs": [
    [
      { "id": 1, "text": "Easy version...", "difficulty": "Easy", "interaction": { "type": "true-false", "question": "...", "answer": true } },
      { "id": 1, "text": "Medium version...", "difficulty": "Medium", "interaction": { "type": "true-false", "question": "...", "answer": true } },
      { "id": 1, "text": "Hard version...", "difficulty": "Hard", "interaction": { "type": "true-false", "question": "...", "answer": true } }
    ],
    ... (2 more paragraphs)
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: "Generate the stratified article.",
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Article stratification failed:", error);
    // Fallback
    return {
      title: "Malaysia's Digital Economy Surge",
      originalUrl: "https://example.com/news",
      paragraphs: [
        [
          { id: 1, text: "Malaysia is seeing a big jump in its digital economy. Many new tech companies are starting in Kuala Lumpur.", difficulty: "Easy", interaction: { type: "true-false", question: "Is the digital economy growing in Malaysia?", answer: true } },
          { id: 1, text: "The digital landscape in Malaysia is undergoing a significant transformation, with Kuala Lumpur emerging as a vibrant hub for tech startups.", difficulty: "Medium", interaction: { type: "true-false", question: "Is Kuala Lumpur becoming a tech hub?", answer: true } },
          { id: 1, text: "Malaysia's digital ecosystem is experiencing an unprecedented metamorphosis, characterized by a burgeoning startup scene centered in the capital.", difficulty: "Hard", interaction: { type: "true-false", question: "Is the startup scene in Malaysia stagnant?", answer: false } }
        ],
        [
          { id: 2, text: "The government is helping by giving money to these new companies. This makes it easier for them to grow.", difficulty: "Easy", interaction: { type: "true-false", question: "Is the government giving money to startups?", answer: true } },
          { id: 2, text: "To accelerate this growth, the government has introduced various funding initiatives aimed at supporting early-stage enterprises.", difficulty: "Medium", interaction: { type: "true-false", question: "Are there funding initiatives for early-stage enterprises?", answer: true } },
          { id: 2, text: "Catalyzing this expansion, the state apparatus has deployed a myriad of fiscal stimuli specifically targeted at incubating nascent ventures.", difficulty: "Hard", interaction: { type: "true-false", question: "Is the state hindering nascent ventures?", answer: false } }
        ],
        [
          { id: 3, text: "Because of this, many young people are learning how to code. They want to get good jobs in the future.", difficulty: "Easy", interaction: { type: "true-false", question: "Are young people learning to code?", answer: true } },
          { id: 3, text: "Consequently, there is a surge in youth pursuing programming skills, driven by the desire to secure lucrative positions in the tech industry.", difficulty: "Medium", interaction: { type: "true-false", question: "Is there a decrease in youth learning programming?", answer: false } },
          { id: 3, text: "As a corollary, a demographic shift is observable wherein the youth are aggressively acquiring coding proficiencies to capitalize on the lucrative prospects within the tech sector.", difficulty: "Hard", interaction: { type: "true-false", question: "Are the youth acquiring coding proficiencies?", answer: true } }
        ]
      ]
    };
  }
}

export interface NewsQuizData {
  title: string;
  sourceUrl: string;
  isFallback?: boolean;
  sections: {
    id: number;
    paragraph: string;
    questions: {
      id: number;
      question: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
    }[];
  }[];
}

export async function fetchRealNewsAndQuiz(category: string): Promise<NewsQuizData> {
  try {
    // 1. WEB SCRAPER: Fetch real news using The Guardian API
    // This guarantees we get a real URL, real title, and full text content without CORS issues.
    const guardianUrl = `https://content.guardianapis.com/search?q=${encodeURIComponent(category)}&show-fields=bodyText&api-key=test`;
    const articlesRes = await fetch(guardianUrl);
    const data = await articlesRes.json();
    
    if (!data.response || !data.response.results || data.response.results.length === 0) {
      throw new Error("No articles found");
    }
    
    // Pick the top article
    const articleMeta = data.response.results[0];
    const title = articleMeta.webTitle;
    const sourceUrl = articleMeta.webUrl;
    let content = articleMeta.fields?.bodyText || title;
      
    content = content.substring(0, 3000) + '...'; // Limit to ~3000 chars for the AI prompt

    // 2. AI PROCESSING: Send the scraped text to Gemini to generate the quiz
    const systemInstruction = `You are an English reading comprehension generator. 
I will provide you with the text of a real tech news article.
Divide the article into logical paragraphs or sections (summarize or clean up the text if necessary to make it readable).
For EACH paragraph/section, generate 1 to 2 multiple-choice questions based specifically on that text.
For each question, provide the correct answer AND a short explanation of why it is correct based on the text.

Return ONLY JSON matching this structure:
{
  "title": "${title.replace(/"/g, '\\"')}",
  "sourceUrl": "${sourceUrl}",
  "sections": [
    {
      "id": number,
      "paragraph": "string (the readable text section)",
      "questions": [
        {
          "id": number,
          "question": "string",
          "options": ["string", "string", "string", "string"],
          "correctAnswer": "string (must exactly match one of the options)",
          "explanation": "string (short explanation of why this is the correct answer)"
        }
      ]
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: `Article Content:\n\n${content}`,
      config: {
        systemInstruction: systemInstruction,
      }
    });
    
    const rawText = response.text || '{}';
    const cleanText = rawText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Failed to fetch real news:", error);
    // Fallback
    return {
      title: `${category} Sector Sees Rapid Growth (Offline Demo)`,
      sourceUrl: "https://www.theguardian.com",
      isFallback: true,
      sections: [
        {
          id: 1,
          paragraph: `The ${category} sector is experiencing unprecedented growth this year, driven by strong initiatives and investment. It has emerged as a premier hub for innovation.`,
          questions: [
            { id: 1, question: `What is driving the growth of the ${category} sector?`, options: ["Agriculture", "Initiatives and investment", "Tourism", "Oil and gas"], correctAnswer: "Initiatives and investment", explanation: "The text explicitly states growth is driven by strong initiatives and investment." }
          ]
        }
      ]
    };
  }
}

export interface ListeningExerciseData {
  audioBase64: string;
  transcript: {
    id: number;
    speaker: string;
    text: string;
  }[];
  questions: {
    id: number;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }[];
}

export async function fetchListeningExercise(topic: string): Promise<ListeningExerciseData> {
  const scriptPrompt = `You are an English listening test creator.
Create a short, realistic conversation (3-4 turns total) between two people (Alex and Sam) about: ${topic}.
Include some emotion or sarcasm.
Create 3-4 multiple-choice questions based on the conversation. The questions should test comprehension of the dialogue, implied meanings, and the speakers' intonation or emotions.
For each question, provide the correct answer and a short explanation.

Return ONLY JSON:
{
  "dialogue": [
    { "speaker": "Alex", "text": "..." },
    { "speaker": "Sam", "text": "..." }
  ],
  "questions": [
    { 
      "id": 1, 
      "question": "...", 
      "options": ["...", "...", "...", "..."], 
      "correctAnswer": "...",
      "explanation": "..."
    }
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: scriptPrompt,
      config: { responseMimeType: "application/json" }
    });

    const data = JSON.parse(response.text || '{}');

    const ttsPrompt = data.dialogue.map((d: any) => `${d.speaker}: ${d.text}`).join('\n');
    
    const ttsResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: ttsPrompt }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              { speaker: 'Alex', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
              { speaker: 'Sam', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
            ]
          }
        }
      }
    });

    const audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    
    const transcript = data.dialogue.map((d: any, idx: number) => {
      return {
        id: idx,
        speaker: d.speaker,
        text: d.text
      };
    });

    return {
      audioBase64,
      transcript,
      questions: data.questions || []
    };
  } catch (error) {
    console.error("Listening exercise generation failed:", error);
    throw error;
  }
}

export interface WritingCrisisData {
  hookMessage: string;
  prompt: string;
  challengeType: string;
  timeLimit: number;
  brokenText?: string;
}

export interface DeconstructionEval {
  pass: boolean;
  feedback: string;
}

export interface ThoughtEval {
  pass: boolean;
  feedback: string;
}

export interface TiktoklishPrompt {
  id: string;
  statement: string;
  audioBase64: string;
  mimeType?: string;
}

export interface TiktoklishFeedback {
  userTranscript: string;
  betterVersion: string;
  improvement: string;
  betterAudioBase64?: string;
  betterAudioMimeType?: string;
}

const tiktoklishCache = new Map<string, TiktoklishFeedback>();

const manglishRules: Array<{ pattern: RegExp, replacement: string, note: string }> = [
  { pattern: /i very like/i, replacement: "I really like", note: "+ natural phrasing" },
  { pattern: /open the light/i, replacement: "Turn on the light", note: "+ correct verb" },
  { pattern: /close the light/i, replacement: "Turn off the light", note: "+ correct verb" },
  { pattern: /exam very stress/i, replacement: "Exams are very stressful", note: "+ grammar" },
  { pattern: /is very danger/i, replacement: "is very dangerous", note: "+ adjective form" },
];

export async function fastEvaluateTiktoklish(transcript: string): Promise<TiktoklishFeedback> {
  const lowerTranscript = transcript.toLowerCase().trim();
  
  // 1. Cache Check
  if (tiktoklishCache.has(lowerTranscript)) {
    return tiktoklishCache.get(lowerTranscript)!;
  }

  // 2. Rule-based Check (Manglish Error Map)
  for (const rule of manglishRules) {
    if (rule.pattern.test(lowerTranscript)) {
      const result = {
        userTranscript: transcript,
        betterVersion: transcript.replace(new RegExp(rule.pattern, 'ig'), rule.replacement),
        improvement: rule.note
      };
      tiktoklishCache.set(lowerTranscript, result);
      return result;
    }
  }

  // 3. AI Rewrite (Compressed Prompt)
  const prompt = `Rewrite the sentence to sound natural and fluent in English. Keep meaning same. Output ONE sentence only.
Input: "${transcript}"
Return ONLY JSON:
{
  "improved": "rewritten sentence",
  "improvement": "+ short note (e.g. + clarity)"
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview', // Layer 1: Fast/cheap model
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    const data = JSON.parse(response.text || '{}');
    const result = {
      userTranscript: transcript,
      betterVersion: data.improved || transcript,
      improvement: data.improvement || "+ fluency"
    };
    
    tiktoklishCache.set(lowerTranscript, result);
    return result;
  } catch (error: any) {
    if (error?.status !== 'RESOURCE_EXHAUSTED' && !error?.message?.includes('429')) {
      console.error("Fast evaluate failed:", error);
    }
    return {
      userTranscript: transcript,
      betterVersion: transcript,
      improvement: "+ try again"
    };
  }
}

export async function generateTiktoklishPrompt(): Promise<TiktoklishPrompt> {
  const prompt = `Generate a single, short, controversial or thought-provoking statement (max 8 words) for a user to react to. 
Examples: "Grades are useless.", "Social media is toxic.", "Money buys happiness.", "AI will replace us."
Return ONLY JSON:
{
  "statement": "..."
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const data = JSON.parse(response.text || '{}');
    const statement = data.statement || "Grades are useless.";

    // Generate TTS
    const ttsResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: statement }] }],
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
    const audioBase64 = inlineData?.data || "";
    const mimeType = inlineData?.mimeType || "audio/wav";

    return {
      id: Math.random().toString(36).substring(7),
      statement,
      audioBase64,
      mimeType
    };
  } catch (error: any) {
    if (error?.status !== 'RESOURCE_EXHAUSTED' && !error?.message?.includes('429')) {
      console.error("Failed to generate Tiktoklish prompt:", error);
    }
    return {
      id: Math.random().toString(36).substring(7),
      statement: "Grades are useless.",
      audioBase64: "",
      mimeType: "audio/wav"
    };
  }
}

export async function evaluateTiktoklishResponse(audioBase64: string): Promise<TiktoklishFeedback> {
  // Fallback if no client-side STT is available. We use AI for both STT and Rewrite in one go.
  const prompt = `Listen to audio. 
1. Transcribe.
2. Rewrite to sound natural/fluent. ONE sentence only.
Return ONLY JSON:
{"transcript": "...", "improved": "...", "improvement": "+ short note"}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: [
        {
          inlineData: {
            mimeType: "audio/webm", // Assuming we record in webm
            data: audioBase64
          }
        },
        prompt
      ],
      config: { responseMimeType: "application/json" }
    });
    const data = JSON.parse(response.text || '{}');
    
    return {
      userTranscript: data.transcript || "I think exam very stress",
      betterVersion: data.improved || "Exams create unnecessary stress for students.",
      improvement: data.improvement || "+ clearer structure"
    };
  } catch (error: any) {
    if (error?.status !== 'RESOURCE_EXHAUSTED' && !error?.message?.includes('429')) {
      console.error("Failed to evaluate Tiktoklish response:", error);
    }
    return {
      userTranscript: "I think exam very stress",
      betterVersion: "Exams create unnecessary stress for students.",
      improvement: "+ clearer structure"
    };
  }
}

export async function generateTTS(text: string): Promise<{ audioBase64: string, mimeType: string }> {
  try {
    const ttsResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
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
    return {
      audioBase64: inlineData?.data || "",
      mimeType: inlineData?.mimeType || "audio/wav"
    };
  } catch (e) {
    console.error("TTS failed", e);
    return { audioBase64: "", mimeType: "audio/wav" };
  }
}
export interface RescueData {
  translation: {
    topic: string;
    type: string;
    sides: string;
  };
  options: string[];
}

export async function generateTranslationAndOptions(prompt: string): Promise<RescueData> {
  const evalPrompt = `You are a "Zero-Idea Rescue" AI. Break down this essay prompt: "${prompt}"
1. Translate it into simple logic: What is the core topic? Is it cause, opinion, or solution? What are the 2 sides?
2. Generate 4 simple, distinct starter choices (arguments/points) the user could make.

Return ONLY JSON:
{
  "translation": {
    "topic": "Simple core topic",
    "type": "Cause / Opinion / Solution",
    "sides": "Side A vs Side B"
  },
  "options": [
    "Starter choice A",
    "Starter choice B",
    "Starter choice C",
    "Starter choice D"
  ]
}`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: evalPrompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return {
      translation: { topic: "The prompt topic", type: "Opinion", sides: "Agree vs Disagree" },
      options: ["It is beneficial", "It is harmful", "It depends on the context", "It has mixed effects"]
    };
  }
}

export async function upgradeIdea(fragment: string, context: string): Promise<{ upgraded: string }> {
  const evalPrompt = `Upgrade this weak writing fragment into a strong, academic sentence.
Context/Topic: ${context}
Weak Fragment: "${fragment}"

Return ONLY JSON:
{
  "upgraded": "The upgraded, sophisticated version of the idea."
}`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: evalPrompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { upgraded: fragment + " (upgraded)" };
  }
}

export async function emergencyFill(prompt: string, option: string): Promise<{ point: string, explanation: string, example: string }> {
  const evalPrompt = `The user is completely frozen. Generate a perfect 3-sentence paragraph for this prompt: "${prompt}"
Based on their chosen option: "${option}"

Sentence 1: Clear Point
Sentence 2: Explanation
Sentence 3: Specific Example

Return ONLY JSON:
{
  "point": "...",
  "explanation": "...",
  "example": "..."
}`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: evalPrompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { point: "API Error.", explanation: "Could not generate.", example: "Please try again." };
  }
}

export interface WritingEvaluation {
  score: number;
  weakness: string;
  fix: string;
  modelAnswer: string;
  miniDrill: {
    original: string;
    instruction: string;
  };
}

export async function generateWritingCrisis(difficulty: string, weakness: string): Promise<WritingCrisisData> {
  const prompt = `You are a high-pressure cognitive training AI for an English writing app. Generate a short, intense writing challenge.
Difficulty: ${difficulty} (easy, medium, crisis)
Target Weakness: ${weakness} (logic, examples, grammar, none)

Challenge Types:
1. "Defend": Provide a controversial statement to defend or attack.
2. "Fix": Provide a terribly written paragraph that needs rewriting.
3. "Expand": Provide a weak, generic idea that needs specific examples.

Return ONLY JSON:
{
  "hookMessage": "⚠️ You have 90 seconds to defend this before you fail.",
  "prompt": "The statement to defend/fix/expand...",
  "challengeType": "Defend / Fix / Expand",
  "timeLimit": 90,
  "brokenText": "Only include if challengeType is Fix"
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Failed to generate writing crisis:", error);
    // Fallback
    return {
      hookMessage: "⚠️ You have 90 seconds to defend this before you fail.",
      prompt: "Social media does more harm than good to society.",
      challengeType: "Defend",
      timeLimit: 90
    };
  }
}

export async function evaluateDeconstruction(prompt: string, taskType: string, keywords: string, rephrase: string): Promise<DeconstructionEval> {
  const evalPrompt = `Evaluate the user's deconstruction of this writing prompt: "${prompt}"
User Task Type: ${taskType}
User Keywords: ${keywords}
User Rephrase: ${rephrase}

Determine if they correctly identified the core task and keywords. If they are completely wrong, fail them.
Return ONLY JSON:
{
  "pass": true/false,
  "feedback": "Short feedback explaining why they passed or failed."
}`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: evalPrompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { pass: true, feedback: "Fallback pass due to error." };
  }
}

export async function evaluateThoughts(prompt: string, point: string, reason: string, example: string): Promise<ThoughtEval> {
  const evalPrompt = `Evaluate the user's initial thoughts for this prompt: "${prompt}"
Point: ${point}
Reason: ${reason}
Example: ${example}

Are these specific, logical, and relevant? If they are vague or generic (e.g. "it is good", "many reasons"), fail them.
Return ONLY JSON:
{
  "pass": true/false,
  "feedback": "Short feedback. If vague, say 'This idea is too general. Be specific.'"
}`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: evalPrompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { pass: true, feedback: "Fallback pass." };
  }
}

export interface IdeaInjection {
  angles: {
    name: string;
    points: string[];
  }[];
}

export async function injectIdeas(prompt: string): Promise<IdeaInjection> {
  const evalPrompt = `Generate 3 distinct angles (e.g., social, economic, personal) to answer this prompt: "${prompt}"
Return ONLY JSON:
{
  "angles": [
    { "name": "Social", "points": ["point 1", "point 2"] },
    { "name": "Economic", "points": ["point 1", "point 2"] },
    { "name": "Personal", "points": ["point 1", "point 2"] }
  ]
}`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: evalPrompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { angles: [{ name: "General", points: ["Think about the impact on daily life.", "Consider financial costs."] }] };
  }
}

export async function evaluateWritingBurst(prompt: string, s1: string, s2: string, s3: string): Promise<WritingEvaluation> {
  const evalPrompt = `Evaluate this segmented paragraph for the prompt: "${prompt}"
Sentence 1 (Point): ${s1}
Sentence 2 (Explain): ${s2}
Sentence 3 (Example): ${s3}

Score based on idea clarity, relevance, and development (0-100). Do NOT score based on length.
Identify their main weakness (e.g., weak examples, unclear logic, grammar).
Provide a specific fix (e.g., "use real-world case + number").
Provide a model answer that perfectly answers the prompt in 3 sentences.
Provide a mini-drill (pick one of their sentences that needs improvement, and give an instruction on how to rewrite it).

Return ONLY JSON:
{
  "score": 85,
  "weakness": "weak examples",
  "fix": "use real-world case + number",
  "modelAnswer": "...",
  "miniDrill": {
    "original": "...",
    "instruction": "rewrite this to be more specific"
  }
}`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: evalPrompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Failed to evaluate writing:", error);
    return {
      score: 75,
      weakness: "API Error",
      fix: "Try again later",
      modelAnswer: "Model answer unavailable due to error.",
      miniDrill: { original: s1, instruction: "Rewrite this." }
    };
  }
}

export async function getDefinition(word: string, context: string) {
  const systemInstruction = `Provide a short, non-intrusive contextual definition for the word "${word}" in this sentence: "${context}".
Keep it under 15 words.
Return ONLY the definition string.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: "Get definition",
      config: {
        systemInstruction: systemInstruction,
      }
    });
    return response.text?.trim() || "Definition unavailable.";
  } catch (error) {
    return "Definition unavailable.";
  }
}
