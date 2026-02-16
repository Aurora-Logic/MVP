import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { user_id, cancel_at_cycle_end = true } = await req.json()

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get active subscription
    const { data: sub, error: fetchError } = await supabase
      .from('subscriptions')
      .select('razorpay_subscription_id, razorpay_customer_id')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .single()

    if (fetchError || !sub?.razorpay_subscription_id) {
      return new Response(JSON.stringify({ error: 'No active subscription found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Cancel subscription via Razorpay API
    const cancelRes = await fetch(
      `https://api.razorpay.com/v1/subscriptions/${sub.razorpay_subscription_id}/cancel`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancel_at_cycle_end: cancel_at_cycle_end ? 1 : 0
        })
      }
    )

    if (!cancelRes.ok) {
      const error = await cancelRes.text()
      console.error('Cancellation failed:', error)
      throw new Error('Failed to cancel Razorpay subscription')
    }

    const canceledSub = await cancelRes.json()

    // Update local database
    if (cancel_at_cycle_end) {
      await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString()
        })
        .eq('razorpay_subscription_id', sub.razorpay_subscription_id)
    } else {
      // Immediate cancellation
      await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString()
        })
        .eq('razorpay_subscription_id', sub.razorpay_subscription_id)
    }

    console.log('Subscription cancelled:', sub.razorpay_subscription_id)

    return new Response(JSON.stringify({
      success: true,
      canceled_at_cycle_end: cancel_at_cycle_end,
      subscription: canceledSub
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    })
  } catch (err) {
    console.error('Error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
