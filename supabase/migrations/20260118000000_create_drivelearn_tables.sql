-- DriveLearn Database Schema
-- Creates all tables needed for class management, file uploads, and commute sessions

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Classes table
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#DA70D6',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Study materials table
CREATE TABLE IF NOT EXISTS public.study_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    extracted_text TEXT,
    processing_status TEXT DEFAULT 'pending',
    processing_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Generated questions table
CREATE TABLE IF NOT EXISTS public.generated_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    study_material_id UUID REFERENCES public.study_materials(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]',
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    difficulty TEXT DEFAULT 'medium',
    question_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Commute sessions table
CREATE TABLE IF NOT EXISTS public.commute_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ended_at TIMESTAMP WITH TIME ZONE,
    questions_answered INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Session responses table
CREATE TABLE IF NOT EXISTS public.session_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.commute_sessions(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.generated_questions(id) ON DELETE CASCADE NOT NULL,
    user_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    response_time_seconds INTEGER,
    answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER set_updated_at_classes
    BEFORE UPDATE ON public.classes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_study_materials
    BEFORE UPDATE ON public.study_materials
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commute_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for classes
CREATE POLICY "Users can view their own classes"
    ON public.classes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own classes"
    ON public.classes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own classes"
    ON public.classes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own classes"
    ON public.classes FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for study_materials
CREATE POLICY "Users can view their own materials"
    ON public.study_materials FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own materials"
    ON public.study_materials FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own materials"
    ON public.study_materials FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own materials"
    ON public.study_materials FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for generated_questions
CREATE POLICY "Users can view their own questions"
    ON public.generated_questions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create questions"
    ON public.generated_questions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own questions"
    ON public.generated_questions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own questions"
    ON public.generated_questions FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for commute_sessions
CREATE POLICY "Users can view their own sessions"
    ON public.commute_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
    ON public.commute_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
    ON public.commute_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
    ON public.commute_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for session_responses
CREATE POLICY "Users can view their own responses"
    ON public.session_responses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.commute_sessions
            WHERE id = session_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create responses"
    ON public.session_responses FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.commute_sessions
            WHERE id = session_id AND user_id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_classes_user_id ON public.classes(user_id);
CREATE INDEX idx_study_materials_class_id ON public.study_materials(class_id);
CREATE INDEX idx_study_materials_user_id ON public.study_materials(user_id);
CREATE INDEX idx_generated_questions_class_id ON public.generated_questions(class_id);
CREATE INDEX idx_generated_questions_user_id ON public.generated_questions(user_id);
CREATE INDEX idx_commute_sessions_user_id ON public.commute_sessions(user_id);
CREATE INDEX idx_commute_sessions_class_id ON public.commute_sessions(class_id);
CREATE INDEX idx_session_responses_session_id ON public.session_responses(session_id);
