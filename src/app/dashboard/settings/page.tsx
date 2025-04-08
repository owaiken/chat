import React from 'react';
import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs';
import { getAdminSupabase } from '@/utils/supabase';
import CustomN8nSettings from '@/components/CustomN8nSettings';

async function getUserSettings(userId: string) {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('subscription_tier, use_custom_n8n, custom_n8n_endpoint, custom_n8n_api_key')
    .eq('clerk_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user settings:', error);
    return {
      tier: 'standard',
      useCustomN8n: false,
      customN8nEndpoint: '',
      customN8nApiKey: '',
    };
  }

  return {
    tier: data.subscription_tier || 'standard',
    useCustomN8n: data.use_custom_n8n || false,
    customN8nEndpoint: data.custom_n8n_endpoint || '',
    customN8nApiKey: data.custom_n8n_api_key || '',
  };
}

export default async function SettingsPage() {
  const { userId } = auth();
  const user = await currentUser();
  
  if (!userId || !user) {
    redirect('/sign-in');
  }

  // Get user settings
  const { tier, useCustomN8n, customN8nEndpoint, customN8nApiKey } = await getUserSettings(userId);
  
  // Only enterprise users can use custom n8n endpoints
  const canUseCustomN8n = tier === 'enterprise';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-500">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="mt-1 text-sm text-gray-900">{user.emailAddresses[0]?.emailAddress || 'No email address'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Subscription</p>
                <p className="mt-1 text-sm text-gray-900">{tier.charAt(0).toUpperCase() + tier.slice(1)}</p>
              </div>
            </div>
          </div>

          {canUseCustomN8n && (
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Custom n8n Integration</h2>
              <p className="text-gray-500 mb-4">
                As an Enterprise user, you can connect to your own n8n instance instead of using our managed workflows.
              </p>
              <CustomN8nSettings 
                userId={userId}
                useCustomN8n={useCustomN8n}
                customN8nEndpoint={customN8nEndpoint}
                customN8nApiKey={customN8nApiKey}
              />
            </div>
          )}

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription Management</h2>
            <p className="text-gray-500 mb-4">
              Manage your subscription or upgrade to a higher tier.
            </p>
            <a
              href="/pricing"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {tier === 'enterprise' ? 'Manage Subscription' : 'Upgrade Subscription'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
