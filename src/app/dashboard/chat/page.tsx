import React from 'react';
import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs';
import ChatInterface from '@/components/ChatInterface';
import { getAdminSupabase } from '@/utils/supabase';

async function getUserSubscription(userId: string) {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('subscription_tier, message_count')
    .eq('clerk_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user subscription:', error);
    return { tier: 'standard', messageCount: 0 };
  }

  return {
    tier: data.subscription_tier || 'standard',
    messageCount: data.message_count || 0,
  };
}

export default async function ChatPage() {
  const { userId } = auth();
  const user = await currentUser();
  
  if (!userId || !user) {
    redirect('/sign-in');
  }

  // Get user's subscription details
  const { tier, messageCount } = await getUserSubscription(userId);

  // Define rate limits based on subscription tier
  const rateLimits = {
    'standard': parseInt(process.env.STANDARD_RATE_LIMIT || '100'),
    'pro': parseInt(process.env.PRO_RATE_LIMIT || '1000'),
    'enterprise': parseInt(process.env.ENTERPRISE_RATE_LIMIT || '10000'),
  };

  // Calculate remaining messages
  const rateLimit = rateLimits[tier as keyof typeof rateLimits];
  const remainingMessages = rateLimit - messageCount;

  // Define available models based on subscription tier
  const availableModels = {
    'standard': [
      { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
      { id: 'anthropic/claude-instant-1', name: 'Claude Instant' },
    ],
    'pro': [
      { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
      { id: 'anthropic/claude-instant-1', name: 'Claude Instant' },
      { id: 'anthropic/claude-2', name: 'Claude 2' },
    ],
    'enterprise': [
      { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
      { id: 'anthropic/claude-instant-1', name: 'Claude Instant' },
      { id: 'anthropic/claude-2', name: 'Claude 2' },
      { id: 'openai/gpt-4', name: 'GPT-4' },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
              <p className="text-sm text-gray-500">
                Subscription: <span className="font-semibold">{tier.charAt(0).toUpperCase() + tier.slice(1)}</span> | 
                Remaining messages today: <span className="font-semibold">{remainingMessages}</span>
              </p>
            </div>
            
            <ChatInterface 
              userId={userId} 
              availableModels={availableModels[tier as keyof typeof availableModels]} 
              remainingMessages={remainingMessages}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
