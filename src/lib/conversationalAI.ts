/**
 * Conversational AI - Like ChatGPT Voice
 * Can understand natural questions, search online, and explain concepts
 */

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface SearchResult {
  title: string;
  snippet: string;
  link: string;
}

/**
 * Search the web using Google Custom Search API (free alternative to Serper)
 */
async function searchWeb(query: string): Promise<SearchResult[]> {
  try {
    // Using Google Custom Search API (free tier: 100 searches/day)
    // You'll need to get API key from: https://developers.google.com/custom-search/v1/introduction
    const apiKey = import.meta.env.VITE_GOOGLE_SEARCH_API_KEY || '';
    const searchEngineId = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID || '';

    if (!apiKey || !searchEngineId) {
      console.warn('Google Search API not configured, using mock results');
      return [];
    }

    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data = await response.json();

    return data.items?.slice(0, 3).map((item: any) => ({
      title: item.title,
      snippet: item.snippet,
      link: item.link,
    })) || [];
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

/**
 * Main conversational AI function
 * Handles natural language questions, searches if needed, and explains concepts
 */
export async function askAI(
  userQuestion: string,
  context: {
    currentTopic?: string;  // What topic/PDF they're studying
    conversationHistory: Message[];  // Previous messages
  }
): Promise<{ answer: string; searchResults?: SearchResult[] }> {
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!openaiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Build conversation with context
  const messages: Message[] = [
    {
      role: 'system',
      content: `You are a helpful study assistant helping a student learn while driving.

Your role:
1. Answer questions clearly and concisely (2-3 sentences max)
2. If you don't know something, say "Let me search for that" and search online
3. Give examples to make concepts clear
4. Keep answers short enough to say out loud (they're driving!)
5. Be encouraging and supportive

Current topic: ${context.currentTopic || 'General studies'}

Important: Keep responses under 100 words for safety while driving.`,
    },
    ...context.conversationHistory,
    {
      role: 'user',
      content: userQuestion,
    },
  ];

  try {
    // Step 1: Ask OpenAI (with function calling for search)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages,
        max_tokens: 300,  // Keep responses short
        temperature: 0.7,
        functions: [
          {
            name: 'search_web',
            description: 'Search the web for current information or facts you don\'t know',
            parameters: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'The search query',
                },
              },
              required: ['query'],
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const message = data.choices[0].message;

    // Step 2: If AI wants to search, do it
    if (message.function_call) {
      const functionArgs = JSON.parse(message.function_call.arguments);
      const searchQuery = functionArgs.query;

      console.log('AI wants to search for:', searchQuery);

      const searchResults = await searchWeb(searchQuery);

      // Step 3: Call OpenAI again with search results
      const followUpMessages: Message[] = [
        ...messages,
        {
          role: 'assistant',
          content: message.content || '',
        },
        {
          role: 'user',
          content: `Here are the search results for "${searchQuery}":\n\n${searchResults
            .map((r) => `${r.title}\n${r.snippet}`)
            .join('\n\n')}\n\nNow answer the original question using this information. Keep it concise (2-3 sentences).`,
        },
      ];

      const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: followUpMessages,
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      const followUpData = await followUpResponse.json();
      return {
        answer: followUpData.choices[0].message.content,
        searchResults,
      };
    }

    // Step 4: Return answer (no search needed)
    return {
      answer: message.content,
    };
  } catch (error: any) {
    console.error('AI error:', error);
    return {
      answer: `Sorry, I encountered an error: ${error.message}. Please try asking your question differently.`,
    };
  }
}

/**
 * Quick helper: Determine if user wants help vs answering quiz
 */
export function isHelpRequest(transcript: string): boolean {
  const helpPhrases = [
    'help',
    'explain',
    'what is',
    'what does',
    'i don\'t understand',
    'can you explain',
    'tell me about',
    'how does',
    'why',
    'what\'s',
  ];

  const lower = transcript.toLowerCase().trim();
  return helpPhrases.some((phrase) => lower.includes(phrase));
}
