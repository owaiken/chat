import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { getAdminSupabase } from '@/utils/supabase';
import { z } from 'zod';

// Schema for validating chat request
const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })
  ),
  model: z.string().optional(),
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
});

// Subscription tier rate limits
const RATE_LIMITS = {
  'standard': parseInt(process.env.STANDARD_RATE_LIMIT || '100'),
  'pro': parseInt(process.env.PRO_RATE_LIMIT || '1000'),
  'enterprise': parseInt(process.env.ENTERPRISE_RATE_LIMIT || '10000'),
};

// Default models for each tier
const TIER_MODELS = {
  'standard': ['openai/gpt-3.5-turbo', 'anthropic/claude-instant-1'],
  'pro': ['openai/gpt-3.5-turbo', 'anthropic/claude-instant-1', 'anthropic/claude-2'],
  'enterprise': ['openai/gpt-3.5-turbo', 'anthropic/claude-instant-1', 'anthropic/claude-2', 'openai/gpt-4'],
};

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = getAuth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const validatedBody = chatRequestSchema.parse(body);
    
    // Get user's subscription tier from database
    const supabase = getAdminSupabase();
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('subscription_tier, message_count')
      .eq('clerk_id', userId)
      .single();
    
    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check rate limit based on subscription tier
    const tier = userData.subscription_tier || 'standard';
    const rateLimit = RATE_LIMITS[tier as keyof typeof RATE_LIMITS];
    
    if (userData.message_count >= rateLimit) {
      return NextResponse.json(
        { error: 'Rate limit exceeded for your subscription tier' },
        { status: 429 }
      );
    }

    // Check if requested model is allowed for user's tier
    const requestedModel = validatedBody.model || 'openai/gpt-3.5-turbo';
    const allowedModels = TIER_MODELS[tier as keyof typeof TIER_MODELS];
    
    if (!allowedModels.includes(requestedModel)) {
      return NextResponse.json(
        { error: `Model ${requestedModel} not available in your subscription tier` },
        { status: 403 }
      );
    }

    // Forward request to Open Router API
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL,
        'X-Title': 'Owaiken Chat'
      },
      body: JSON.stringify({
        messages: validatedBody.messages,
        model: requestedModel,
        temperature: validatedBody.temperature || 0.7,
        max_tokens: validatedBody.max_tokens || 1000,
      }),
    });

    if (!openRouterResponse.ok) {
      const errorData = await openRouterResponse.json();
      return NextResponse.json(
        { error: 'Error from model provider', details: errorData },
        { status: openRouterResponse.status }
      );
    }

    // Increment user's message count
    await supabase
      .from('users')
      .update({ message_count: userData.message_count + 1 })
      .eq('clerk_id', userId);

    // Store conversation in database with RLS
    const messages = validatedBody.messages;
    await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        messages: messages,
        model: requestedModel,
      });

    // Return the response from Open Router
    const data = await openRouterResponse.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error processing chat request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
