// Groq AI Integration
import Groq from 'groq-sdk';

const groqApiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;

if (!groqApiKey) {
  console.warn('GROQ_API_KEY not found. AI features will use fallback responses.');
}

const groq = groqApiKey ? new Groq({ 
  apiKey: groqApiKey,
  dangerouslyAllowBrowser: true // For React Native/Expo
}) : null;

export interface GenerateTextOptions {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

/**
 * Generate text using Groq's LLM API
 */
export async function generateText({
  prompt,
  systemPrompt,
  maxTokens = 1000,
  temperature = 0.7,
  model = 'llama-3.3-70b-versatile'
}: GenerateTextOptions): Promise<string> {
  if (!groq) {
    console.warn('Groq client not initialized. Returning empty response.');
    return '';
  }

  try {
    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt
    });

    const completion = await groq.chat.completions.create({
      messages,
      model,
      temperature,
      max_tokens: maxTokens,
      top_p: 1,
      stream: false,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error('Groq API error:', error);
    if (error?.error?.message) {
      throw new Error(`Groq API error: ${error.error.message}`);
    }
    throw error;
  }
}

/**
 * Generate streaming text (for future use)
 */
export async function* generateTextStream({
  prompt,
  systemPrompt,
  maxTokens = 1000,
  temperature = 0.7,
  model = 'llama-3.3-70b-versatile'
}: GenerateTextOptions): AsyncGenerator<string, void, unknown> {
  if (!groq) {
    console.warn('Groq client not initialized. No streaming available.');
    return;
  }

  try {
    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt
    });

    const stream = await groq.chat.completions.create({
      messages,
      model,
      temperature,
      max_tokens: maxTokens,
      top_p: 1,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error: any) {
    console.error('Groq streaming error:', error);
    throw error;
  }
}

// Legacy compatibility exports for existing code
export const AI = {
  generate: generateText,
};

export const newell = {
  generate: generateText,
  chat: {
    ask: async ({ prompt, systemMessage }: { prompt: string; systemMessage?: string }) => {
      return generateText({ prompt, systemPrompt: systemMessage });
    },
  },
};

export const NewellAI = {
  generate: generateText,
  chat: {
    ask: async ({ prompt, systemMessage }: { prompt: string; systemMessage?: string }) => {
      return generateText({ prompt, systemPrompt: systemMessage });
    },
  },
};

export const NewellAIClient = {
  generate: generateText,
};

export const AIService = {
  generate: generateText,
};

/**
 * Extract JSON from LLM response that may contain markdown or prose
 */
export function extractJSON(response: string): string {
  // Try to find JSON in markdown code blocks
  const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find JSON array or object
  const jsonArrayMatch = response.match(/\[\s*\{[\s\S]*?\}\s*\]/);
  if (jsonArrayMatch) {
    return jsonArrayMatch[0];
  }

  const jsonObjectMatch = response.match(/\{[\s\S]*?\}/);
  if (jsonObjectMatch) {
    return jsonObjectMatch[0];
  }

  // Return as-is and let caller handle parse error
  return response;
}

export { generateText as default };
