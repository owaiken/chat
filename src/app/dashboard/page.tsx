import React from 'react';
import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs';
import Link from 'next/link';
import { getAdminSupabase } from '@/utils/supabase';

async function getUserData(userId: string) {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('subscription_tier, message_count, subscription_status')
    .eq('clerk_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user data:', error);
    return {
      tier: 'standard',
      messageCount: 0,
      subscriptionStatus: 'inactive',
    };
  }

  return {
    tier: data.subscription_tier || 'standard',
    messageCount: data.message_count || 0,
    subscriptionStatus: data.subscription_status || 'inactive',
  };
}

async function getRecentConversations(userId: string) {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from('conversations')
    .select('id, title, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }

  return data || [];
}

async function getScriptTemplates() {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from('python_scripts')
    .select('id, name, description')
    .eq('is_template', true)
    .limit(5);

  if (error) {
    console.error('Error fetching script templates:', error);
    return [];
  }

  return data || [];
}

export default async function DashboardPage() {
  const { userId } = auth();
  const user = await currentUser();
  
  if (!userId || !user) {
    redirect('/sign-in');
  }

  // Get user data and recent conversations
  const { tier, messageCount, subscriptionStatus } = await getUserData(userId);
  const recentConversations = await getRecentConversations(userId);
  const scriptTemplates = await getScriptTemplates();

  // Define rate limits based on subscription tier
  const rateLimits = {
    'standard': parseInt(process.env.STANDARD_RATE_LIMIT || '100'),
    'pro': parseInt(process.env.PRO_RATE_LIMIT || '1000'),
    'enterprise': parseInt(process.env.ENTERPRISE_RATE_LIMIT || '10000'),
  };

  // Calculate remaining messages
  const rateLimit = rateLimits[tier as keyof typeof rateLimits];
  const remainingMessages = rateLimit - messageCount;
  const usagePercentage = (messageCount / rateLimit) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.firstName || 'User'}</h1>
            <p className="text-gray-500">
              Your current plan: <span className="font-semibold">{tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
              {subscriptionStatus !== 'active' && tier !== 'standard' && (
                <span className="ml-2 text-red-500">(Inactive)</span>
              )}
            </p>
          </div>

          {/* Usage Stats */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Statistics</h2>
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Messages used: {messageCount} / {rateLimit}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {remainingMessages} remaining
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${
                    usagePercentage > 90
                      ? 'bg-red-600'
                      : usagePercentage > 70
                      ? 'bg-yellow-500'
                      : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                ></div>
              </div>
            </div>
            {subscriptionStatus !== 'active' && tier === 'standard' && (
              <div className="mt-4">
                <Link
                  href="/pricing"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Upgrade your plan
                </Link>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/dashboard/chat"
                  className="inline-flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-indigo-600 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">New Chat</span>
                </Link>
                <Link
                  href="/dashboard/scripts"
                  className="inline-flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-indigo-600 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">Run Script</span>
                </Link>
                <Link
                  href="/dashboard/history"
                  className="inline-flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-indigo-600 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">History</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="inline-flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-indigo-600 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">Settings</span>
                </Link>
              </div>
            </div>

            {/* Recent Conversations */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Conversations</h2>
              {recentConversations.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {recentConversations.map((conversation) => (
                    <li key={conversation.id} className="py-3">
                      <Link
                        href={`/dashboard/chat/${conversation.id}`}
                        className="block hover:bg-gray-50"
                      >
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.title || 'Untitled conversation'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(conversation.created_at).toLocaleString()}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No recent conversations. Start a new chat!
                </p>
              )}
              <div className="mt-4">
                <Link
                  href="/dashboard/history"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  View all conversations →
                </Link>
              </div>
            </div>
          </div>

          {/* Script Templates */}
          <div className="bg-white shadow rounded-lg p-6 mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Script Templates</h2>
            {scriptTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scriptTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <h3 className="text-lg font-medium text-gray-900 mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-500 mb-3">{template.description}</p>
                    <Link
                      href={`/dashboard/scripts/${template.id}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Run script →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No script templates available yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
