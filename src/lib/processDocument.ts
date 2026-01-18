import { supabase } from '@/integrations/supabase/client';

interface GeneratedQuestion {
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export async function processDocument(materialId: string): Promise<void> {
  try {
    // Get material details
    const { data: material, error: materialError } = await supabase
      .from('study_materials')
      .select('*')
      .eq('id', materialId)
      .single();

    if (materialError || !material) {
      throw new Error(`Material not found: ${materialError?.message}`);
    }

    // Update status to processing
    await supabase
      .from('study_materials')
      .update({ processing_status: 'processing' })
      .eq('id', materialId);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('study-materials')
      .download(material.file_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    // Extract text based on file type
    let extractedText = '';

    if (material.file_type === 'text/plain' || material.file_type === 'text/markdown') {
      extractedText = await fileData.text();
    } else if (material.file_type === 'application/pdf') {
      // For PDFs, extract as text (basic approach)
      extractedText = await fileData.text();
    } else {
      extractedText = await fileData.text();
    }

    // Save extracted text
    await supabase
      .from('study_materials')
      .update({ extracted_text: extractedText })
      .eq('id', materialId);

    console.log(`Extracted text length: ${extractedText.length} characters`);

    // Generate questions using OpenAI API
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey || apiKey === 'your-openai-api-key-here') {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.1',
        max_tokens: 4096,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: `Generate 10 multiple-choice quiz questions from the following text.

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
4. Vary the difficulty levels
5. Return ONLY the JSON array, no other text

Text to process:
${extractedText.slice(0, 15000)}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const openaiResponse = await response.json();
    const content = openaiResponse.choices[0].message.content;

    console.log('OpenAI response received');

    // Parse questions from OpenAI response
    let questions: GeneratedQuestion[];
    try {
      // Extract JSON from response (GPT might wrap it in markdown)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      questions = JSON.parse(jsonMatch[0]);
    } catch (parseError: any) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error(`Failed to parse questions: ${parseError.message}`);
    }

    console.log(`Generated ${questions.length} questions`);

    // Save questions to database
    const questionsToInsert = questions.map((q, index) => ({
      class_id: material.class_id,
      study_material_id: material.id,
      user_id: material.user_id,
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation || null,
      difficulty: q.difficulty || 'medium',
      question_order: index,
    }));

    const { error: insertError } = await supabase
      .from('generated_questions')
      .insert(questionsToInsert);

    if (insertError) {
      throw new Error(`Failed to save questions: ${insertError.message}`);
    }

    // Update material status to completed
    await supabase
      .from('study_materials')
      .update({
        processing_status: 'completed',
        processing_error: null,
      })
      .eq('id', materialId);

    console.log(`Successfully processed material ${materialId}`);
  } catch (error: any) {
    console.error('Error processing document:', error);

    // Update material status to failed
    await supabase
      .from('study_materials')
      .update({
        processing_status: 'failed',
        processing_error: error.message,
      })
      .eq('id', materialId);

    throw error;
  }
}
