// RevenueCat Webhook Handler for Supabase Edge Function
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

const REVENUECAT_WEBHOOK_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');

interface RevenueCatEvent {
  api_version: string;
  event: {
    id: string;
    type: string;
    app_user_id: string;
    product_id: string;
    period_type: string;
    purchased_at_ms: number;
    expiration_at_ms: number;
    store: string;
    environment: string;
    entitlement_ids: string[];
    is_trial_period: boolean;
    presented_offering_id?: string;
    price?: number;
    currency?: string;
  };
}

/**
 * Verify webhook signature from RevenueCat
 */
async function verifySignature(
  signature: string | null,
  body: string
): Promise<boolean> {
  if (!signature || !REVENUECAT_WEBHOOK_SECRET) {
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(REVENUECAT_WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(body)
    );

    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return signature.toLowerCase() === expectedSignature.toLowerCase();
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

/**
 * Main webhook handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-RevenueCat-Signature',
      },
    });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('X-RevenueCat-Signature');

    // Verify webhook signature
    const isValid = await verifySignature(signature, body);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 401 });
    }

    const payload: RevenueCatEvent = JSON.parse(body);
    const { event } = payload;

    console.log(`Received RevenueCat event: ${event.type} for user ${event.app_user_id}`);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Determine subscription tier
    let tier: 'free' | 'pro' = 'free';
    if (event.entitlement_ids?.includes('pro') || event.entitlement_ids?.includes('family')) {
      tier = 'pro';
    }

    // Upsert subscription data
    const subscriptionData = {
      user_id: event.app_user_id,
      tier,
      revenue_cat_user_id: event.app_user_id,
      active_entitlements: event.entitlement_ids || [],
      subscription_start_date: new Date(event.purchased_at_ms).toISOString(),
      subscription_end_date: event.expiration_at_ms
        ? new Date(event.expiration_at_ms).toISOString()
        : null,
      is_trial: event.is_trial_period || false,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from('user_subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'user_id',
      });

    if (upsertError) {
      console.error('Error upserting subscription:', upsertError);
      throw upsertError;
    }

    // Handle specific event types
    switch (event.type) {
      case 'INITIAL_PURCHASE':
        console.log(`New purchase for user ${event.app_user_id}: ${event.product_id}`);
        // TODO: Send welcome email or trigger onboarding flow
        break;

      case 'RENEWAL':
        console.log(`Subscription renewed for user ${event.app_user_id}`);
        // TODO: Update streak, send thank you notification
        break;

      case 'CANCELLATION':
        console.log(`Subscription cancelled for user ${event.app_user_id}`);
        // Mark as cancelled but keep active until expiration
        await supabase
          .from('user_subscriptions')
          .update({
            tier: 'free',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', event.app_user_id);
        // TODO: Send cancellation survey
        break;

      case 'UNCANCELLATION':
        console.log(`Subscription reactivated for user ${event.app_user_id}`);
        break;

      case 'NON_RENEWING_PURCHASE':
        console.log(`Non-renewing purchase for user ${event.app_user_id}`);
        break;

      case 'EXPIRATION':
        console.log(`Subscription expired for user ${event.app_user_id}`);
        await supabase
          .from('user_subscriptions')
          .update({
            tier: 'free',
            active_entitlements: [],
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', event.app_user_id);
        break;

      case 'BILLING_ISSUE':
        console.log(`Billing issue for user ${event.app_user_id}`);
        // TODO: Send payment failure email
        break;

      case 'PRODUCT_CHANGE':
        console.log(`Product changed for user ${event.app_user_id}`);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Log webhook event for debugging
    await supabase.from('webhook_logs').insert({
      source: 'revenuecat',
      event_type: event.type,
      user_id: event.app_user_id,
      payload: payload,
      processed_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
