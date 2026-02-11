# RevenueCat Webhook Handler

This Supabase Edge Function handles webhook events from RevenueCat to sync subscription status with your database.

## Setup

1. **Deploy the function:**
   ```bash
   supabase functions deploy revenuecat-webhook
   ```

2. **Set environment variables:**
   ```bash
   # In Supabase Dashboard → Edge Functions → revenuecat-webhook → Settings
   REVENUECAT_WEBHOOK_SECRET=your_webhook_secret_from_revenuecat
   ```

3. **Configure RevenueCat webhook:**
   - Go to RevenueCat Dashboard → Projects → [Your Project] → Integrations
   - Add webhook URL: `https://[your-project-ref].supabase.co/functions/v1/revenuecat-webhook`
   - Set Authorization: Use the webhook secret you generated

4. **Generate webhook secret:**
   ```bash
   # Generate a secure random secret
   openssl rand -hex 32
   ```

## Webhook Events Handled

- **INITIAL_PURCHASE**: First subscription purchase
- **RENEWAL**: Subscription renewed
- **CANCELLATION**: Subscription cancelled (marked for expiration)
- **EXPIRATION**: Subscription expired
- **BILLING_ISSUE**: Payment failed
- **PRODUCT_CHANGE**: User upgraded/downgraded
- **UNCANCELLATION**: User reactivated subscription

## Database Schema Required

The webhook expects a `user_subscriptions` table:

```sql
CREATE TABLE user_subscriptions (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro')) DEFAULT 'free',
  revenue_cat_user_id TEXT,
  active_entitlements TEXT[] NOT NULL DEFAULT '{}',
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  is_trial BOOLEAN NOT NULL DEFAULT false,
  trial_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Optional logging table:

```sql
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Testing

Test the webhook locally:

```bash
supabase functions serve revenuecat-webhook
```

Send test webhook:

```bash
curl -X POST http://localhost:54321/functions/v1/revenuecat-webhook \
  -H "Content-Type: application/json" \
  -H "X-RevenueCat-Signature: your_test_signature" \
  -d '{
    "api_version": "1.0",
    "event": {
      "type": "INITIAL_PURCHASE",
      "app_user_id": "test-user-123",
      "product_id": "anchor_pro_monthly",
      "purchased_at_ms": 1234567890000,
      "expiration_at_ms": 1237246890000,
      "store": "app_store",
      "environment": "SANDBOX",
      "entitlement_ids": ["pro"],
      "is_trial_period": false
    }
  }'
```

## Security

- Webhook signature verification is enabled by default
- Uses HMAC-SHA256 for signature validation
- Requires service role key for database writes
- CORS headers configured for API access

## Troubleshooting

Check function logs:
```bash
supabase functions logs revenuecat-webhook
```

Common issues:
- **401 Invalid signature**: Check webhook secret matches RevenueCat
- **404 Not found**: Ensure function is deployed
- **500 Database error**: Verify user_subscriptions table exists
