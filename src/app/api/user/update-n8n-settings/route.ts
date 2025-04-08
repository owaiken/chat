import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { getAdminSupabase } from '@/utils/supabase';
import { z } from 'zod';

// Schema for validating n8n settings update
const n8nSettingsSchema = z.object({
  useCustomN8n: z.boolean(),
  customN8nEndpoint: z.string().url().optional().or(z.literal('')),
  customN8nApiKey: z.string().optional().or(z.literal('')),
});

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
    const validatedBody = n8nSettingsSchema.parse(body);
    
    // Get user's subscription tier from database
    const supabase = getAdminSupabase();
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('clerk_id', userId)
      .single();
    
    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Only enterprise users can use custom n8n endpoints
    if (userData.subscription_tier !== 'enterprise' && validatedBody.useCustomN8n) {
      return NextResponse.json(
        { error: 'Only enterprise users can use custom n8n endpoints' },
        { status: 403 }
      );
    }

    // Update user settings
    const { error: updateError } = await supabase
      .from('users')
      .update({
        use_custom_n8n: validatedBody.useCustomN8n,
        custom_n8n_endpoint: validatedBody.customN8nEndpoint,
        custom_n8n_api_key: validatedBody.customN8nApiKey,
      })
      .eq('clerk_id', userId);
    
    if (updateError) {
      console.error('Error updating user settings:', updateError);
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error processing n8n settings update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
