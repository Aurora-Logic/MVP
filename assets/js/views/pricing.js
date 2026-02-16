// ════════════════════════════════════════
// PRICING — Subscription plans page
// ════════════════════════════════════════

/* exported renderPricing */

function renderPricing() {
    CUR = null;
    if (typeof hideTOC === 'function') hideTOC();

    document.getElementById('topTitle').textContent = 'Pricing';
    const topSearch = document.getElementById('topSearch');
    if (topSearch) topSearch.style.display = 'none';

    const body = document.getElementById('bodyScroll');
    body.innerHTML = `
        <div class="pricing-container">
            <div class="pricing-header">
                <h1>Choose Your Plan</h1>
                <p>Start free, upgrade as you grow.</p>

                <!-- Billing toggle -->
                <div class="billing-toggle">
                    <button class="billing-toggle-btn active" data-interval="monthly">Monthly</button>
                    <button class="billing-toggle-btn" data-interval="yearly">
                        Yearly <span class="discount-badge">Save 20%</span>
                    </button>
                </div>
            </div>

            <div class="pricing-grid" id="pricingGrid">
                ${buildPricingCards('monthly')}
            </div>

            <div class="pricing-faq">
                <h3>Frequently Asked Questions</h3>
                ${buildFAQ()}
            </div>
        </div>
    `;

    // Bind events
    document.querySelectorAll('.billing-toggle-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.billing-toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const interval = btn.dataset.interval;
            updatePricingCards(interval);
        };
    });

    lucide.createIcons();
}

function buildPricingCards(interval) {
    const plans = {
        free: {
            name: 'Free',
            price: { monthly: 0, yearly: 0 },
            features: [
                '5 proposals per month',
                '3 clients',
                'Basic templates',
                'PDF export',
                'Email support'
            ],
            cta: 'Get Started',
            ctaAction: 'startFree'
        },
        pro: {
            name: 'Pro',
            price: { monthly: 999, yearly: 9999 },
            features: [
                '50 proposals per month',
                'Unlimited clients',
                'Premium templates',
                'Advanced analytics',
                'Priority support',
                'Custom branding',
                'Team collaboration (3 users)'
            ],
            cta: 'Start Free Trial',
            ctaAction: 'startCheckout',
            popular: true
        },
        team: {
            name: 'Team',
            price: { monthly: 2399, yearly: 23999 },
            features: [
                'Unlimited proposals',
                'Unlimited clients',
                'All Pro features',
                'Unlimited team members',
                'Advanced permissions',
                'SSO (coming soon)',
                'Dedicated support'
            ],
            cta: 'Start Free Trial',
            ctaAction: 'startCheckout'
        }
    };

    return Object.entries(plans).map(([key, p]) => {
        const price = p.price[interval];
        const priceDisplay = interval === 'yearly' ? Math.round(price / 12) : price;
        const billingNote = interval === 'yearly' ? `/mo (billed ₹${price.toLocaleString('en-IN')} annually)` : '/mo';

        return `
            <div class="pricing-card ${p.popular ? 'pricing-card-popular' : ''}" data-plan="${key}">
                ${p.popular ? '<div class="popular-badge">Most Popular</div>' : ''}
                <div class="pricing-card-header">
                    <h3>${p.name}</h3>
                    <div class="pricing-price">
                        <span class="price-amount">₹${priceDisplay.toLocaleString('en-IN')}</span>
                        <span class="price-period">${billingNote}</span>
                    </div>
                </div>
                <ul class="pricing-features">
                    ${p.features.map(f => `<li><i data-lucide="check"></i> ${f}</li>`).join('')}
                </ul>
                <button class="btn ${p.popular ? '' : 'btn-outline'}" onclick="${p.ctaAction}('${key}', '${interval}')">
                    ${p.cta}
                </button>
            </div>
        `;
    }).join('');
}

async function startCheckout(plan, interval) {
    if (!isLoggedIn()) {
        toast('Please sign in to subscribe', 'warning');
        // Show login modal
        if (typeof showLoginModal === 'function') showLoginModal();
        return;
    }

    toast('Opening checkout...', 'info');

    // Opens Razorpay checkout modal
    await createRazorpaySubscription(plan, interval);
}

function startFree() {
    if (!isLoggedIn()) {
        if (typeof showLoginModal === 'function') showLoginModal();
    } else {
        navigate('/dashboard');
    }
}

function updatePricingCards(interval) {
    const grid = document.getElementById('pricingGrid');
    if (grid) {
        grid.innerHTML = buildPricingCards(interval);
        lucide.createIcons();
    }
}

function buildFAQ() {
    const faqs = [
        {
            q: 'Can I cancel anytime?',
            a: 'Yes, you can cancel your subscription at any time. You\'ll continue to have access until the end of your billing period.'
        },
        {
            q: 'Do you offer refunds?',
            a: 'We offer a 14-day money-back guarantee. If you\'re not satisfied, contact us for a full refund.'
        },
        {
            q: 'What payment methods do you accept?',
            a: 'We accept all major credit cards, debit cards, UPI, and net banking via Razorpay.'
        },
        {
            q: 'Can I upgrade or downgrade my plan?',
            a: 'Yes, you can change your plan at any time from your billing settings.'
        }
    ];

    return faqs.map(faq => `
        <details class="faq-item">
            <summary>${faq.q}</summary>
            <p>${faq.a}</p>
        </details>
    `).join('');
}
