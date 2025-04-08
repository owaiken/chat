import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminSupabase } from '@/utils/supabase';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  const supabase = getAdminSupabase();

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Get customer details
      const customer = await stripe.customers.retrieve(session.customer as string);
      
      // Get subscription details
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      
      // Determine subscription tier based on price ID
      let tier = 'standard';
      if (subscription.items.data[0].price.id === process.env.PRO_PLAN_ID) {
        tier = 'pro';
      } else if (subscription.items.data[0].price.id === process.env.ENTERPRISE_PLAN_ID) {
        tier = 'enterprise';
      }
      
      // Update user in database
      const { error } = await supabase
        .from('users')
        .update({
          stripe_customer_id: customer.id,
          stripe_subscription_id: subscription.id,
          subscription_tier: tier,
          subscription_status: subscription.status,
          message_count: 0, // Reset message count on new subscription
        })
        .eq('clerk_id', session.client_reference_id);
      
      if (error) {
        console.error('Error updating user subscription:', error);
        return NextResponse.json({ error: 'Error updating user subscription' }, { status: 500 });
      }
      
      break;
    }
    
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      
      // If this is a subscription renewal, reset the message count
      if (invoice.subscription) {
        const { data: users, error } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_subscription_id', invoice.subscription)
          .limit(1);
        
        if (!error && users.length > 0) {
          await supabase
            .from('users')
            .update({ message_count: 0 })
            .eq('id', users[0].id);
        }
      }
      
      break;
    }
    
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      
      // Determine subscription tier based on price ID
      let tier = 'standard';
      if (subscription.items.data[0].price.id === process.env.PRO_PLAN_ID) {
        tier = 'pro';
      } else if (subscription.items.data[0].price.id === process.env.ENTERPRISE_PLAN_ID) {
        tier = 'enterprise';
      }
      
      // Update user in database
      const { error } = await supabase
        .from('users')
        .update({
          subscription_tier: tier,
          subscription_status: subscription.status,
        })
        .eq('stripe_subscription_id', subscription.id);
      
      if (error) {
        console.error('Error updating user subscription:', error);
      }
      
      break;
    }
    
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      
      // Update user in database
      const { error } = await supabase
        .from('users')
        .update({
          subscription_tier: 'standard',
          subscription_status: 'canceled',
        })
        .eq('stripe_subscription_id', subscription.id);
      
      if (error) {
        console.error('Error updating user subscription:', error);
      }
      
      break;
    }
    
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
