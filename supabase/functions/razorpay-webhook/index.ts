import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

const RAZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  const signature = req.headers.get('x-razorpay-signature')
  const body = await req.text()

  // Verify webhook signature
  try {
    if (!signature) {
      console.error('Missing signature header')
      return new Response(JSON.stringify({ error: 'Missing signature' }), { status: 400 })
    }

    const expectedSignature = createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) {
      console.error('Webhook signature verification failed')
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 })
    }
  } catch (err) {
    console.error('Webhook signature verification error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 400 })
  }

  const event = JSON.parse(body)
  console.log('Received event:', event.event)

  try {
    switch (event.event) {
      case 'subscription.activated':
      case 'subscription.charged': {
        const subscription = event.payload.subscription.entity
        const payment = event.payload.payment?.entity
        await handleSubscriptionActivated(subscription, payment)
        break
      }

      case 'subscription.updated': {
        const subscription = event.payload.subscription.entity
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'subscription.cancelled':
      case 'subscription.halted': {
        const subscription = event.payload.subscription.entity
        await handleSubscriptionCancelled(subscription)
        break
      }

      case 'subscription.paused':
      case 'subscription.resumed': {
        const subscription = event.payload.subscription.entity
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'payment.captured': {
        const payment = event.payload.payment.entity
        await handlePaymentCaptured(payment)
        break
      }

      case 'payment.failed': {
        const payment = event.payload.payment.entity
        await handlePaymentFailed(payment)
        break
      }

      default:
        console.log('Unhandled event type:', event.event)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    console.error('Error processing webhook:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})

async function handleSubscriptionActivated(subscription: any, payment: any) {
  const userId = subscription.notes?.user_id
  const plan = subscription.notes?.plan || 'pro'

  console.log('Subscription activated for user:', userId, 'plan:', plan)

  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      razorpay_customer_id: subscription.customer_id,
      razorpay_subscription_id: subscription.id,
      razorpay_plan_id: subscription.plan_id,
      plan: plan,
      status: subscription.status === 'active' ? 'active' : 'trialing',
      current_period_start: new Date(subscription.current_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_end * 1000).toISOString(),
      cancel_at_period_end: subscription.has_scheduled_changes || false,
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      amount: subscription.plan_amount / 100,
      currency: 'INR',
      interval: subscription.plan_period === 'monthly' ? 'month' : 'year',
      proposals_limit: plan === 'pro' ? 50 : (plan === 'team' ? null : 5),
    }, {
      onConflict: 'razorpay_subscription_id'
    })

  if (error) {
    console.error('Error upserting subscription:', error)
    throw error
  }

  // Record payment if provided
  if (payment) {
    await supabase.from('payment_history').insert({
      user_id: userId,
      amount: payment.amount / 100,
      currency: payment.currency.toUpperCase(),
      status: 'succeeded',
      razorpay_payment_id: payment.id,
      razorpay_order_id: payment.order_id,
      description: `Payment for ${plan} plan`,
      paid_at: new Date(payment.created_at * 1000).toISOString()
    })
  }

  // Queue welcome email
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, name')
    .eq('id', userId)
    .single()

  if (profile) {
    await supabase.from('email_queue').insert({
      to_email: profile.email,
      to_name: profile.name,
      template: 'subscription_created',
      subject: `Welcome to ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan!`,
      body_html: `<p>Hi ${profile.name || 'there'},</p><p>Your ${plan} subscription is now active. Thank you for choosing ProposalKit!</p>`,
      template_data: { plan, user_id: userId }
    })
  }
}

async function handleSubscriptionUpdate(subscription: any) {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status === 'active' ? 'active' : subscription.status,
      current_period_start: new Date(subscription.current_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_end * 1000).toISOString(),
      cancel_at_period_end: subscription.has_scheduled_changes || false,
      amount: subscription.plan_amount / 100,
      updated_at: new Date().toISOString()
    })
    .eq('razorpay_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating subscription:', error)
    throw error
  }
}

async function handleSubscriptionCancelled(subscription: any) {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString()
    })
    .eq('razorpay_subscription_id', subscription.id)

  if (error) {
    console.error('Error canceling subscription:', error)
    throw error
  }

  // Queue cancellation email
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('razorpay_subscription_id', subscription.id)
    .single()

  if (sub) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', sub.user_id)
      .single()

    if (profile) {
      await supabase.from('email_queue').insert({
        to_email: profile.email,
        to_name: profile.name,
        template: 'subscription_cancelled',
        subject: 'Subscription Cancelled',
        body_html: `<p>Hi ${profile.name || 'there'},</p><p>Your subscription has been cancelled. You'll continue to have access until the end of your billing period.</p>`
      })
    }
  }
}

async function handlePaymentCaptured(payment: any) {
  // Find subscription by customer_id
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id, user_id')
    .eq('razorpay_customer_id', payment.customer_id)
    .single()

  if (!sub) {
    console.warn('No subscription found for customer:', payment.customer_id)
    return
  }

  await supabase.from('payment_history').insert({
    subscription_id: sub.id,
    user_id: sub.user_id,
    amount: payment.amount / 100,
    currency: payment.currency.toUpperCase(),
    status: 'succeeded',
    razorpay_payment_id: payment.id,
    razorpay_order_id: payment.order_id,
    description: 'Payment captured for subscription',
    paid_at: new Date(payment.created_at * 1000).toISOString()
  })
}

async function handlePaymentFailed(payment: any) {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id, user_id')
    .eq('razorpay_customer_id', payment.customer_id)
    .single()

  if (!sub) {
    console.warn('No subscription found for customer:', payment.customer_id)
    return
  }

  await supabase.from('payment_history').insert({
    subscription_id: sub.id,
    user_id: sub.user_id,
    amount: payment.amount / 100,
    currency: payment.currency.toUpperCase(),
    status: 'failed',
    razorpay_payment_id: payment.id,
    failure_message: payment.error_description || 'Payment failed'
  })

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('razorpay_customer_id', payment.customer_id)

  // Queue payment failed email
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, name')
    .eq('id', sub.user_id)
    .single()

  if (profile) {
    await supabase.from('email_queue').insert({
      to_email: profile.email,
      to_name: profile.name,
      template: 'payment_failed',
      subject: 'Payment Failed - Action Required',
      body_html: `<p>Hi ${profile.name || 'there'},</p><p>We couldn't process your payment. Please update your payment method to continue your subscription.</p>`
    })
  }
}
