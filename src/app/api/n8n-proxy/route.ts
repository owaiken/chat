import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { getAdminSupabase } from '@/utils/supabase';
import { z } from 'zod';

// Define workflow access by subscription tier
const WORKFLOW_ACCESS = {
  standard: ['basic-chat', 'simple-rag'],
  pro: ['basic-chat', 'simple-rag', 'advanced-rag', 'data-analysis'],
  enterprise: ['basic-chat', 'simple-rag', 'advanced-rag', 'data-analysis', 'custom-workflows'],
};

// Rate limits per tier (requests per day)
const RATE_LIMITS = {
  standard: 100,
  pro: 1000,
  enterprise: 10000,
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
    const { workflowId, inputs } = body;
    
    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    // Get user's subscription tier and custom n8n settings from database
    const supabase = getAdminSupabase();
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('subscription_tier, workflow_count, message_count, use_custom_n8n, custom_n8n_endpoint, custom_n8n_api_key')
      .eq('clerk_id', userId)
      .single();
    
    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this workflow based on subscription tier
    const tier = userData.subscription_tier || 'standard';
    
    // Enterprise users with custom n8n can bypass workflow restrictions
    const usingCustomN8n = tier === 'enterprise' && userData.use_custom_n8n && userData.custom_n8n_endpoint;
    
    if (!usingCustomN8n) {
      const allowedWorkflows = WORKFLOW_ACCESS[tier as keyof typeof WORKFLOW_ACCESS];
      
      if (!allowedWorkflows.includes(workflowId)) {
        return NextResponse.json(
          { error: `Workflow ${workflowId} not available in your subscription tier` },
          { status: 403 }
        );
      }
    }

    // Check rate limit based on subscription tier
    const rateLimit = RATE_LIMITS[tier as keyof typeof RATE_LIMITS];
    const workflowCount = userData.workflow_count || 0;
    const messageCount = userData.message_count || 0;
    
    // Check both message and workflow counts against limits
    if (workflowCount >= rateLimit || messageCount >= rateLimit) {
      return NextResponse.json(
        { error: 'Rate limit exceeded for your subscription tier' },
        { status: 429 }
      );
    }

    // Determine which n8n endpoint to use
    let n8nEndpoint: string;
    let headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (usingCustomN8n) {
      // Use the customer's custom n8n endpoint
      n8nEndpoint = `${userData.custom_n8n_endpoint}/webhook/${workflowId}`;
      
      // Add their API key if provided
      if (userData.custom_n8n_api_key) {
        headers['Authorization'] = `Bearer ${userData.custom_n8n_api_key}`;
      }
    } else {
      // Use our managed n8n instance
      n8nEndpoint = `http://localhost:5678/webhook/${workflowId}`;
      headers['Authorization'] = `Bearer ${process.env.N8N_API_KEY}`;
    }
    
    // Call n8n workflow
    const n8nResponse = await fetch(n8nEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(inputs)
    });

    if (!n8nResponse.ok) {
      const errorData = await n8nResponse.json();
      return NextResponse.json(
        { error: 'Error from n8n workflow', details: errorData },
        { status: n8nResponse.status }
      );
    }

    // Increment user's workflow and message counts
    await supabase
      .from('users')
      .update({ 
        workflow_count: workflowCount + 1,
        message_count: messageCount + 1
      })
      .eq('clerk_id', userId);

    // Log workflow execution
    await supabase
      .from('workflow_executions')
      .insert({
        user_id: userId,
        workflow_id: workflowId,
        inputs: inputs,
      });

    // Return the response from n8n
    const data = await n8nResponse.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error processing workflow request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
