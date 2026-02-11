// ════════════════════════════════════════
// SECTION TEMPLATE PACKS (Phase 5.6)
// ════════════════════════════════════════

/* exported renderPacksTab, previewPack, insertPack */
const SECTION_PACKS = [
    {
        id: 'saas', name: 'SaaS Pack', icon: 'cloud', color: 'var(--blue)',
        desc: 'Technical product proposals with architecture and SLA details',
        sections: [
            { title: 'Product Overview', content: 'Our platform provides a comprehensive solution designed to streamline your workflows, improve efficiency, and deliver measurable results.' },
            { title: 'Features & Benefits', content: '• Core Feature Set — Full access to all platform capabilities\n• Integrations — Connect with your existing tools and workflows\n• Analytics Dashboard — Real-time insights and reporting\n• Automation — Save time with intelligent workflow automation' },
            { title: 'Technical Architecture', content: 'Built on a modern cloud-native architecture ensuring:\n\n• 99.9% uptime SLA\n• SOC 2 Type II certified infrastructure\n• End-to-end encryption at rest and in transit\n• Multi-region deployment for low latency' },
            { title: 'Implementation Plan', content: 'Phase 1: Discovery & Setup (Week 1)\nPhase 2: Data Migration (Week 2-3)\nPhase 3: Configuration & Customization (Week 3-4)\nPhase 4: User Training (Week 5)\nPhase 5: Go-Live & Support (Week 6)' },
            { title: 'SLA & Support', content: 'Standard Support:\n• Email support with 24-hour response\n• Knowledge base access\n\nPremium Support:\n• Dedicated account manager\n• 4-hour response time\n• Quarterly business reviews' },
            { title: 'Security & Compliance', content: 'We take security seriously:\n\n• SOC 2 Type II certified\n• GDPR compliant\n• Regular penetration testing\n• Role-based access controls\n• Audit logging for all actions' },
            { title: 'Pricing Tiers', content: 'We offer flexible pricing to match your needs — see the Pricing section below for detailed package comparison.' },
            { title: 'Next Steps', content: '1. Review this proposal\n2. Schedule a product demo\n3. Select your preferred tier\n4. Sign the agreement\n5. Begin onboarding' }
        ]
    },
    {
        id: 'agency', name: 'Agency Pack', icon: 'palette', color: 'var(--purple)',
        desc: 'Creative agency proposals with process, team, and case studies',
        sections: [
            { title: 'About Us', content: 'We are a full-service creative agency that partners with ambitious brands to create meaningful digital experiences. Our team combines strategy, design, and technology to deliver results that matter.' },
            { title: 'Our Process', content: '1. Discover — We immerse ourselves in your brand, audience, and goals\n2. Define — We align on strategy, scope, and success metrics\n3. Design — We craft thoughtful, beautiful solutions\n4. Develop — We build with precision and performance in mind\n5. Deliver — We launch, measure, and optimize' },
            { title: 'Scope of Work', content: 'This proposal includes the following deliverables:\n\n• Brand strategy and positioning\n• Visual identity and design system\n• Website design and development\n• Content strategy and copywriting\n• Launch support and analytics setup' },
            { title: 'Timeline', content: 'Week 1-2: Discovery & Strategy\nWeek 3-4: Concepts & Design Direction\nWeek 5-8: Design & Development\nWeek 9-10: Review & Refinement\nWeek 11-12: Launch & Handoff' },
            { title: 'The Team', content: 'Your dedicated project team:\n\n• Creative Director — Overall vision and quality\n• Lead Designer — Visual design and UX\n• Developer — Front-end and back-end build\n• Project Manager — Your single point of contact\n• Copywriter — Messaging and content' },
            { title: 'Case Study', content: 'Recent Success: [Client Name]\n\nChallenge: Needed to modernize their digital presence and increase conversions.\n\nSolution: Complete brand refresh including new website, design system, and content strategy.\n\nResult: 45% increase in conversions, 60% reduction in bounce rate, featured in design publications.' },
            { title: 'Terms & Conditions', content: '• All intellectual property transfers to client upon final payment\n• Source files included in deliverables\n• Two rounds of revisions included per phase\n• Additional revisions billed at agreed hourly rate\n• 30-day post-launch support included' },
            { title: 'Next Steps', content: '1. Review and approve this proposal\n2. Sign the project agreement\n3. Submit 50% deposit\n4. Schedule kickoff call\n5. Begin the discovery phase' }
        ]
    },
    {
        id: 'consulting', name: 'Consulting Pack', icon: 'briefcase', color: 'var(--amber)',
        desc: 'Professional consulting proposals with methodology and deliverables',
        sections: [
            { title: 'Executive Summary', content: 'This proposal outlines our recommended approach to address the challenges identified during our initial discussions. Our proven methodology and experienced team will deliver actionable insights and measurable outcomes.' },
            { title: 'Background & Context', content: 'Based on our discovery conversations, we understand that your organization is seeking to:\n\n• Optimize operational efficiency\n• Improve decision-making through data\n• Align teams around shared goals and metrics\n• Build scalable processes for growth' },
            { title: 'Methodology', content: 'Our engagement follows a structured approach:\n\n1. Assessment — Stakeholder interviews, data analysis, current-state mapping\n2. Analysis — Gap identification, benchmarking, opportunity sizing\n3. Strategy — Recommendations, roadmap, prioritization\n4. Implementation — Pilot programs, change management, training\n5. Measurement — KPI tracking, reporting, optimization' },
            { title: 'Deliverables', content: '• Current State Assessment Report\n• Stakeholder Interview Findings\n• Gap Analysis & Opportunity Map\n• Strategic Recommendations Deck\n• Implementation Roadmap (90-day, 6-month, 12-month)\n• Executive Presentation\n• Monthly Progress Reports' },
            { title: 'Timeline', content: 'Phase 1: Assessment (Week 1-3)\nPhase 2: Analysis & Strategy (Week 4-6)\nPhase 3: Recommendations & Roadmap (Week 7-8)\nPhase 4: Implementation Support (Week 9-12)\n\nTotal engagement: 12 weeks' },
            { title: 'Team Bios', content: 'Lead Consultant — 15+ years of industry experience specializing in operational transformation and strategic planning.\n\nSenior Analyst — Expert in data analytics, process optimization, and benchmarking.\n\nProject Coordinator — Ensures smooth communication and timely delivery across all workstreams.' },
            { title: 'Investment', content: 'Our fees are structured to align with the value delivered. See the Pricing section below for a detailed breakdown of professional fees, expenses, and payment schedule.' },
            { title: 'Terms', content: '• Engagement governed by Master Services Agreement\n• Confidentiality provisions in effect throughout engagement\n• Weekly status updates and monthly steering committee reviews\n• Change requests managed through formal change order process\n• Cancellation requires 30 days written notice' }
        ]
    },
    {
        id: 'freelancer', name: 'Freelancer Pack', icon: 'user', color: 'var(--green)',
        desc: 'Solo professional proposals — simple, personal, effective',
        sections: [
            { title: 'About Me', content: 'I am a [your specialty] with [X] years of experience helping businesses like yours achieve their goals. I combine technical expertise with a deep understanding of design and user experience to deliver work that truly makes a difference.' },
            { title: 'Services', content: 'For this project, I will provide:\n\n• [Primary service]\n• [Secondary service]\n• [Additional service]\n\nAll work includes collaborative feedback rounds and direct communication throughout.' },
            { title: 'Scope of Work', content: 'Included in this proposal:\n\n• Initial consultation and requirements gathering\n• [Deliverable 1]\n• [Deliverable 2]\n• [Deliverable 3]\n• Final review and delivery\n• 14-day post-delivery support' },
            { title: 'Timeline', content: 'Week 1: Kickoff & Discovery\nWeek 2-3: First Draft / Prototype\nWeek 4: Revisions & Refinements\nWeek 5: Final Delivery & Handoff\n\nEstimated completion: 5 weeks from project start' },
            { title: 'Testimonial', content: '"Working with [Your Name] was an absolute pleasure. They understood our vision immediately and delivered beyond our expectations. Highly recommended!"\n\n— [Client Name], [Company]' },
            { title: 'Investment', content: 'Please refer to the Pricing section below for a detailed breakdown. My rates reflect the quality and dedication I bring to every project.' },
            { title: 'Terms', content: '• 50% deposit required to begin work\n• Remaining 50% due upon project completion\n• Two revision rounds included in scope\n• Additional revisions at [hourly rate] per hour\n• All source files delivered upon final payment\n• 14-day post-delivery bug fix period included' },
            { title: 'Next Steps', content: '1. Review this proposal\n2. Let me know if you have any questions\n3. Accept the proposal to get started\n4. I will send an invoice for the deposit\n5. We schedule our kickoff call and begin!' }
        ]
    }
];

function renderPacksTab() {
    const el = document.getElementById('libPacksView');
    if (!el) return;
    el.innerHTML = `<div class="pack-grid">${SECTION_PACKS.map(pack => `
        <div class="pack-card">
            <div class="pack-icon" style="background:color-mix(in srgb, ${pack.color} 12%, transparent);color:${pack.color}"><i data-lucide="${pack.icon}"></i></div>
            <div class="pack-name">${esc(pack.name)}</div>
            <div class="pack-desc">${esc(pack.desc)}</div>
            <div class="pack-count">${pack.sections.length} sections</div>
            <div style="display:flex;gap:6px;margin-top:10px">
                <button class="btn-sm-outline" style="flex:1" onclick="previewPack('${pack.id}')"><i data-lucide="eye"></i> Preview</button>
                <button class="btn-sm" style="flex:1" onclick="insertPack('${pack.id}')"><i data-lucide="plus"></i> Insert</button>
            </div>
        </div>`).join('')}</div>`;
    lucide.createIcons();
}

function previewPack(packId) {
    const pack = SECTION_PACKS.find(p => p.id === packId);
    if (!pack) return;
    document.getElementById('packPreviewModal')?.remove();
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap'; wrap.id = 'packPreviewModal';
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };
    wrap.innerHTML = `<div class="modal" style="width:480px;max-height:80vh;overflow-y:auto" onclick="event.stopPropagation()">
        <div class="modal-t" style="display:flex;align-items:center;gap:8px">
            <span style="display:inline-flex;width:28px;height:28px;align-items:center;justify-content:center;border-radius:8px;background:color-mix(in srgb, ${pack.color} 12%, transparent);color:${pack.color}"><i data-lucide="${pack.icon}" style="width:16px;height:16px"></i></span>
            ${esc(pack.name)}
        </div>
        <div class="modal-d">${esc(pack.desc)}</div>
        <div style="margin-top:14px">
            ${pack.sections.map((s, i) => `<div class="pack-preview-item">
                <span class="pack-preview-num">${i + 1}</span>
                <div>
                    <div class="pack-preview-title">${esc(s.title)}</div>
                    <div class="pack-preview-excerpt">${esc((s.content || '').slice(0, 80))}${(s.content || '').length > 80 ? '...' : ''}</div>
                </div>
            </div>`).join('')}
        </div>
        <div class="modal-foot" style="margin-top:14px">
            <button class="btn-sm-outline" onclick="document.getElementById('packPreviewModal').remove()">Close</button>
            <button class="btn-sm" onclick="document.getElementById('packPreviewModal').remove();insertPack('${pack.id}')"><i data-lucide="plus"></i> Insert All ${pack.sections.length} Sections</button>
        </div>
    </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    lucide.createIcons();
}

function insertPack(packId) {
    const pack = SECTION_PACKS.find(p => p.id === packId);
    if (!pack) return;
    const p = cur();
    if (!p) { toast('Open a proposal first'); return; }
    pack.sections.forEach(s => {
        p.sections.push({ title: s.title, content: s.content });
    });
    persist();
    document.getElementById('libModal')?.remove();
    renderSections(p);
    refreshStatsBar();
    lucide.createIcons();
    toast(`${pack.sections.length} sections added from ${pack.name}`);
}
