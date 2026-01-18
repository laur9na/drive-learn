import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessDocumentRequest {
  materialId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
    const { materialId } = await req.json() as ProcessDocumentRequest;

    console.log(`Processing document: ${materialId}`);

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
      // For PDFs, we'll send directly to Claude's Files API
      // For now, use a placeholder - in production, you'd use pdf-parse or Claude's native PDF support
      extractedText = '[PDF content - Claude will process this]';
    } else {
      extractedText = await fileData.text();
    }

    // Save extracted text
    await supabase
      .from('study_materials')
      .update({ extracted_text: extractedText })
      .eq('id', materialId);

    console.log(`Extracted text length: ${extractedText.length} characters`);

    // Generate questions using Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
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
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const claudeResponse = await response.json();
    const content = claudeResponse.content[0].text;

    console.log('Claude response received');

    // Parse questions from Claude response
    let questions;
    try {
      // Extract JSON from response (Claude might wrap it in markdown)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      questions = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', content);
      throw new Error(`Failed to parse questions: ${parseError.message}`);
    }

    console.log(`Generated ${questions.length} questions`);

    // Save questions to database
    const questionsToInsert = questions.map((q: any, index: number) => ({
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
        processing_error: null
      })
      .eq('id', materialId);

    console.log(`Successfully processed material ${materialId}`);

    return new Response(
      JSON.stringify({
        success: true,
        questionsGenerated: questions.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing document:', error);

    // Try to update material status to failed
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { materialId } = await req.json();
      await supabase
        .from('study_materials')
        .update({
          processing_status: 'failed',
          processing_error: error.message
        })
        .eq('id', materialId);
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
