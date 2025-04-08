import React, { useState } from 'react';

interface CustomN8nSettingsProps {
  userId: string;
  useCustomN8n: boolean;
  customN8nEndpoint: string;
  customN8nApiKey: string;
}

export default function CustomN8nSettings({
  userId,
  useCustomN8n,
  customN8nEndpoint,
  customN8nApiKey,
}: CustomN8nSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(useCustomN8n);
  const [endpoint, setEndpoint] = useState(customN8nEndpoint);
  const [apiKey, setApiKey] = useState(customN8nApiKey);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const response = await fetch('/api/user/update-n8n-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          useCustomN8n: isEnabled,
          customN8nEndpoint: endpoint,
          customN8nApiKey: apiKey,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      setSaveStatus('success');
    } catch (error) {
      console.error('Error updating n8n settings:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Use Custom n8n Instance</h3>
          <p className="mt-1 text-sm text-gray-500">
            Enable this to use your own n8n instance instead of our managed workflows
          </p>
        </div>
        <button
          type="button"
          className={`${
            isEnabled ? 'bg-indigo-600' : 'bg-gray-200'
          } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
          onClick={() => setIsEnabled(!isEnabled)}
        >
          <span className="sr-only">Use custom n8n</span>
          <span
            className={`${
              isEnabled ? 'translate-x-5' : 'translate-x-0'
            } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
          />
        </button>
      </div>

      {isEnabled && (
        <>
          <div>
            <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700">
              n8n Endpoint URL
            </label>
            <div className="mt-1">
              <input
                type="url"
                name="endpoint"
                id="endpoint"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="https://your-n8n-instance.com"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                required
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              The base URL of your n8n instance (e.g., https://your-n8n-instance.com)
            </p>
          </div>

          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
              n8n API Key (Optional)
            </label>
            <div className="mt-1">
              <input
                type="password"
                name="apiKey"
                id="apiKey"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Your n8n API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              If your n8n instance requires authentication, provide your API key here
            </p>
          </div>
        </>
      )}

      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>

        {saveStatus === 'success' && (
          <span className="text-green-600 text-sm">Settings saved successfully!</span>
        )}

        {saveStatus === 'error' && (
          <span className="text-red-600 text-sm">Failed to save settings. Please try again.</span>
        )}
      </div>
    </form>
  );
}
