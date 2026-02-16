import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!

const PLAN_IDS = {
  pro_monthly: Deno.env.get('RAZORPAY_PLAN_ID_PRO_MONTHLY'),
  pro_yearly: Deno.env.get('RAZORPAY_PLAN_ID_PRO_YEARLY'),
  team_monthly: Deno.env.get('RAZORPAY_PLAN_ID_TEAM_MONTHLY'),
  team_yearly: Deno.env.get('RAZORPAY_PLAN_ID_TEAM_YEARLY'),
}

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
    const { plan, interval, user_id, user_email, user_name } = await req.json()

    if (!plan || !interval || !user_id || !user_email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const planKey = `${plan}_${interval}` as keyof typeof PLAN_IDS
    const planId = PLAN_IDS[planKey]

    if (!planId) {
      return new Response(JSON.stringify({ error: 'Invalid plan or interval' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create or get Razorpay customer
    let customerId
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('razorpay_customer_id')
      .eq('user_id', user_id)
      .single()

    if (existingSub?.razorpay_customer_id) {
      customerId = existingSub.razorpay_customer_id
      console.log('Using existing customer:', customerId)
    } else {
      // Create new customer
      const customerRes = await fetch('https://api.razorpay.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: user_name,
          email: user_email,
          notes: {
            user_id
          }
        })
      })

      if (!customerRes.ok) {
        const error = await customerRes.text()
        console.error('Customer creation failed:', error)
        throw new Error('Failed to create Razorpay customer')
      }

      const customer = await customerRes.json()
      customerId = customer.id
      console.log('Created new customer:', customerId)
    }

    // Create subscription
    const subscriptionRes = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: planId,
        customer_id: customerId,
        total_count: interval === 'yearly' ? 1 : 12, // 12 months for monthly, 1 year for yearly
        quantity: 1,
        customer_notify: 1,
        notes: {
          user_id,
          user_email,
          plan
        }
      })
    })

    if (!subscriptionRes.ok) {
      const error = await subscriptionRes.text()
      console.error('Subscription creation failed:', error)
      throw new Error('Failed to create Razorpay subscription')
    }

    const subscription = await subscriptionRes.json()

    console.log('Subscription created:', subscription.id)

    // Return subscription details for frontend checkout
    return new Response(JSON.stringify({
      subscription_id: subscription.id,
      razorpay_key: RAZORPAY_KEY_ID,
      amount: subscription.plan?.item?.amount || 0,
      currency: subscription.plan?.item?.currency || 'INR',
      customer_id: customerId
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
