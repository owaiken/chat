-- Create schema for our application
CREATE SCHEMA IF NOT EXISTS public;

-- Enable Row Level Security on all tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;

-- Users table to store user information and subscription details
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_tier TEXT DEFAULT 'standard',
  subscription_status TEXT DEFAULT 'inactive',
  message_count INTEGER DEFAULT 0,
  workflow_count INTEGER DEFAULT 0,
  custom_n8n_endpoint TEXT,
  custom_n8n_api_key TEXT,
  use_custom_n8n BOOLEAN DEFAULT false
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS policy for users table (users can only see their own data)
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid()::text = clerk_id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid()::text = clerk_id);

-- Conversations table to store chat history
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  messages JSONB NOT NULL,
  model TEXT,
  title TEXT GENERATED ALWAYS AS (
    substring((messages->>0->>'content')::text from 1 for 50)
  ) STORED
);

-- Enable RLS on conversations table
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS policy for conversations table (users can only see their own conversations)
CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own conversations" ON public.conversations
  FOR DELETE USING (auth.uid()::text = user_id);

-- Python scripts table to store predefined scripts
CREATE TABLE IF NOT EXISTS public.python_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  code TEXT NOT NULL,
  is_template BOOLEAN DEFAULT false,
  user_id TEXT,
  approved BOOLEAN DEFAULT false
);

-- Enable RLS on python_scripts table
ALTER TABLE public.python_scripts ENABLE ROW LEVEL SECURITY;

-- RLS policy for python_scripts table
-- Everyone can view templates
CREATE POLICY "Everyone can view template scripts" ON public.python_scripts
  FOR SELECT USING (is_template = true);

-- Users can view their own scripts
CREATE POLICY "Users can view own scripts" ON public.python_scripts
  FOR SELECT USING (auth.uid()::text = user_id);

-- Users can create their own scripts
CREATE POLICY "Users can insert own scripts" ON public.python_scripts
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own scripts
CREATE POLICY "Users can update own scripts" ON public.python_scripts
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Users can delete their own scripts
CREATE POLICY "Users can delete own scripts" ON public.python_scripts
  FOR DELETE USING (auth.uid()::text = user_id);

-- Script executions table to track script usage
CREATE TABLE IF NOT EXISTS public.script_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  script_id UUID REFERENCES public.python_scripts(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'pending',
  result JSONB,
  error TEXT
);

-- Enable RLS on script_executions table
ALTER TABLE public.script_executions ENABLE ROW LEVEL SECURITY;

-- RLS policy for script_executions table
CREATE POLICY "Users can view own script executions" ON public.script_executions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own script executions" ON public.script_executions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  endpoint TEXT NOT NULL,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  model TEXT,
  cost DECIMAL(10, 6) DEFAULT 0
);

-- Enable RLS on usage_logs table
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS policy for usage_logs table
CREATE POLICY "Users can view own usage logs" ON public.usage_logs
  FOR SELECT USING (auth.uid()::text = user_id);

-- Create function to reset message and workflow counts at the start of each month
CREATE OR REPLACE FUNCTION reset_usage_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users SET message_count = 0, workflow_count = 0;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to reset message and workflow counts at the start of each month
CREATE OR REPLACE TRIGGER reset_usage_counts_monthly
  AFTER INSERT ON public.usage_logs
  FOR EACH ROW
  WHEN (
    NEW.created_at >= date_trunc('month', CURRENT_DATE) AND 
    NEW.created_at < date_trunc('month', CURRENT_DATE) + interval '1 day'
  )
  EXECUTE FUNCTION reset_usage_counts();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_python_scripts_user_id ON public.python_scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_script_executions_user_id ON public.script_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
