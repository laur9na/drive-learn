import { ipcMain } from 'electron';

// API key is only accessible in main process - NOT exposed to renderer
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | any[];
}

export function setupOpenAIHandlers() {
  // Generate questions from study material
  ipcMain.handle('openai:generateQuestions', async (_, text: string, isImage: boolean = false) => {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    let messages: Message[];

    if (isImage) {
      // Handle image-based question generation
      const base64Data = text.replace('[IMAGE_BASE64:', '').replace(']', '');
      messages = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Look at this image and generate 20 multiple-choice quiz questions based on its content.

Format your response as a JSON array with this exact structure:
[
  {
    "question_text": "The question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "The exact text of the correct option",
    "explanation": "Brief explanation of why this is correct",
    "difficulty": "easy|medium|hard"
  }
]

Make sure:
1. Each question has exactly 4 options
2. The correct_answer matches one of the options exactly
3. Questions test understanding of the content shown
4. Return ONLY the JSON array, no other text`
            },
            {
              type: 'image_url',
              image_url: { url: base64Data }
            }
          ]
        }
      ];
    } else {
      // Text-based question generation
      messages = [
        {
          role: 'user',
          content: `Generate 30 multiple-choice quiz questions from the following study material.

Format your response as a JSON array with this exact structure:
[
  {
    "question_text": "The question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "The exact text of the correct option",
    "explanation": "Brief explanation of why this is correct",
    "difficulty": "easy|medium|hard"
  }
]

Make sure:
1. Each question has exactly 4 options
2. The correct_answer matches one of the options exactly
3. Questions test understanding, not just memorization
4. Cover DIFFERENT topics from the text (don't repeat)
5. Vary the difficulty levels
6. Return ONLY the JSON array, no other text

Study material content:
${text.slice(0, 15000)}`
        }
      ];
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: isImage ? 'gpt-4o' : 'gpt-4o-mini',
          max_tokens: 4096,
          temperature: 0.7,
          messages,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      throw new Error(error.message || 'Failed to generate questions');
    }
  });

  // Conversational AI for help mode
  ipcMain.handle('openai:askAI', async (_, question: string, context: { currentTopic?: string; conversationHistory?: any[] }) => {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are a helpful study assistant helping a driver learn while they commute. Keep your answers:
- CONCISE: 2-3 sentences maximum
- SAFE: Under 100 words so it can be read aloud quickly
- CLEAR: Easy to understand without visual aids
- FOCUSED: Directly answer the question

${context.currentTopic ? `Current topic: ${context.currentTopic}` : ''}`;

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...(context.conversationHistory || []),
      { role: 'user', content: question }
    ];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 200,
          temperature: 0.7,
          messages,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return {
        answer: data.choices[0].message.content,
        searchResults: null,
      };
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      throw new Error(error.message || 'Failed to get AI response');
    }
  });

  // App version handler
  ipcMain.handle('app:getVersion', () => {
    return require('../../../package.json').version;
  });
}
