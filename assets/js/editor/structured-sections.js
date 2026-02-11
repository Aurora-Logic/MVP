// ════════════════════════════════════════
// STRUCTURED SECTIONS — Testimonial & Case Study
// ════════════════════════════════════════

/* exported STRUCTURED_SECTION_DEFAULTS, structuredSecBlockHtml, setRating, collectStructuredSection, buildStructuredSectionPdf */
const STRUCTURED_SECTION_DEFAULTS = [
    { title: 'Client Testimonial', type: 'testimonial', category: 'general', testimonial: { quote: 'Working with this team transformed our business. Their attention to detail and strategic approach exceeded our expectations.', author: 'Jane Smith', company: 'Acme Corp', rating: 5 } },
    { title: 'Case Study', type: 'case-study', category: 'general', caseStudy: { challenge: 'The client needed to modernize their legacy system while maintaining business continuity.', solution: 'We implemented a phased migration approach with parallel systems running during transition.', result: '40% reduction in operational costs and 3x improvement in system performance.' } }
];

function structuredSecBlockHtml(s, i) {
    if (s.type === 'testimonial') return testimonialFormHtml(s, i);
    if (s.type === 'case-study') return caseStudyFormHtml(s, i);
    return '';
}

function testimonialFormHtml(s, i) {
    const t = s.testimonial || { quote: '', author: '', company: '', rating: 5 };
    const stars = [1, 2, 3, 4, 5].map(n =>
        `<button type="button" class="star-btn ${n <= (t.rating || 5) ? 'on' : ''}" onclick="setRating(${i}, ${n})" data-tooltip="${n} star${n > 1 ? 's' : ''}" data-side="bottom" data-align="center"><i data-lucide="star"></i></button>`
    ).join('');
    return `<div class="sec-b open" draggable="false" data-idx="${i}" data-type="testimonial">
    <div class="sec-hd" onclick="togSec(this)">
      <span class="sec-grip" onmousedown="this.closest('.sec-b').draggable=true" onmouseup="this.closest('.sec-b').draggable=false"><i data-lucide="grip-vertical"></i></span>
      <span class="badge-sec-type testi"><i data-lucide="quote"></i> Testimonial</span>
      <span class="sec-nm">${esc(s.title) || 'Client Testimonial'}</span>
      <span class="sec-chv"><i data-lucide="chevron-down"></i></span>
      <div class="sec-acts" onclick="event.stopPropagation()">
        <button class="btn-sm-icon-ghost" onclick="saveSectionToLib(this)" data-tooltip="Save to Library" data-side="bottom" data-align="center"><i data-lucide="bookmark"></i></button>
        <button class="btn-sm-icon-ghost" onclick="delSec(this)" data-tooltip="Delete" data-side="bottom" data-align="center"><i data-lucide="trash-2"></i></button>
      </div>
    </div>
    <div class="sec-bd">
      <div class="fg"><label class="fl">Title</label><input type="text" class="sec-ti" value="${esc(s.title)}" placeholder="e.g. What Our Clients Say" oninput="updSecName(this);dirty()"></div>
      <div class="fg"><label class="fl">Quote</label><textarea class="testi-quote" rows="3" placeholder="Client's testimonial quote..." oninput="dirty()">${esc(t.quote)}</textarea></div>
      <div class="fr">
        <div class="fg"><label class="fl">Author</label><input type="text" class="testi-author" value="${esc(t.author)}" placeholder="e.g. Jane Smith" oninput="dirty()"></div>
        <div class="fg"><label class="fl">Company</label><input type="text" class="testi-company" value="${esc(t.company)}" placeholder="e.g. Acme Corp" oninput="dirty()"></div>
      </div>
      <div class="fg"><label class="fl">Rating</label><div class="star-rating" data-idx="${i}">${stars}</div></div>
    </div>
  </div>`;
}

function caseStudyFormHtml(s, i) {
    const cs = s.caseStudy || { challenge: '', solution: '', result: '' };
    return `<div class="sec-b open" draggable="false" data-idx="${i}" data-type="case-study">
    <div class="sec-hd" onclick="togSec(this)">
      <span class="sec-grip" onmousedown="this.closest('.sec-b').draggable=true" onmouseup="this.closest('.sec-b').draggable=false"><i data-lucide="grip-vertical"></i></span>
      <span class="badge-sec-type cs"><i data-lucide="lightbulb"></i> Case Study</span>
      <span class="sec-nm">${esc(s.title) || 'Case Study'}</span>
      <span class="sec-chv"><i data-lucide="chevron-down"></i></span>
      <div class="sec-acts" onclick="event.stopPropagation()">
        <button class="btn-sm-icon-ghost" onclick="saveSectionToLib(this)" data-tooltip="Save to Library" data-side="bottom" data-align="center"><i data-lucide="bookmark"></i></button>
        <button class="btn-sm-icon-ghost" onclick="delSec(this)" data-tooltip="Delete" data-side="bottom" data-align="center"><i data-lucide="trash-2"></i></button>
      </div>
    </div>
    <div class="sec-bd">
      <div class="fg"><label class="fl">Title</label><input type="text" class="sec-ti" value="${esc(s.title)}" placeholder="e.g. Project Success Story" oninput="updSecName(this);dirty()"></div>
      <div class="fg"><label class="fl">Challenge</label><textarea class="cs-challenge" rows="2" placeholder="What problem did the client face?" oninput="dirty()">${esc(cs.challenge)}</textarea></div>
      <div class="fg"><label class="fl">Solution</label><textarea class="cs-solution" rows="2" placeholder="How did you solve it?" oninput="dirty()">${esc(cs.solution)}</textarea></div>
      <div class="fg"><label class="fl">Result</label><textarea class="cs-result" rows="2" placeholder="What was the outcome?" oninput="dirty()">${esc(cs.result)}</textarea></div>
    </div>
  </div>`;
}

function setRating(idx, rating) {
    const wrap = document.querySelector(`.star-rating[data-idx="${idx}"]`);
    if (!wrap) return;
    wrap.querySelectorAll('.star-btn').forEach((btn, i) => {
        btn.classList.toggle('on', i < rating);
    });
    dirty();
}

function collectStructuredSection(block) {
    const type = block.dataset.type;
    const title = block.querySelector('.sec-ti')?.value || '';
    if (type === 'testimonial') {
        const ratingBtns = block.querySelectorAll('.star-btn.on');
        return { type, title, testimonial: {
            quote: block.querySelector('.testi-quote')?.value || '',
            author: block.querySelector('.testi-author')?.value || '',
            company: block.querySelector('.testi-company')?.value || '',
            rating: ratingBtns.length || 5
        }};
    }
    if (type === 'case-study') {
        return { type, title, caseStudy: {
            challenge: block.querySelector('.cs-challenge')?.value || '',
            solution: block.querySelector('.cs-solution')?.value || '',
            result: block.querySelector('.cs-result')?.value || ''
        }};
    }
    return null;
}

// PDF rendering
function buildTestimonialPdfHtml(s, bc) {
    const t = s.testimonial || {};
    const stars = '★'.repeat(t.rating || 5) + '☆'.repeat(5 - (t.rating || 5));
    return `<div style="margin-bottom:20px;page-break-inside:avoid;break-inside:avoid">
    <div style="font-size:14px;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid ${bc};color:${bc}">${esc(s.title)}</div>
    <div style="background:#fafafa;border-left:4px solid ${bc};padding:16px 20px;border-radius:0 8px 8px 0;margin:8px 0">
      <div style="font-size:14px;color:#3f3f46;line-height:1.7;font-style:italic">"${esc(t.quote)}"</div>
      <div style="margin-top:12px;display:flex;align-items:center;gap:8px">
        <div style="width:32px;height:32px;border-radius:50%;background:${bc};color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700">${(t.author || 'A').charAt(0).toUpperCase()}</div>
        <div>
          <div style="font-size:13px;font-weight:600;color:#18181b">${esc(t.author)}</div>
          ${t.company ? `<div style="font-size:11px;color:#71717a">${esc(t.company)}</div>` : ''}
        </div>
        <div style="margin-left:auto;color:${bc};font-size:14px;letter-spacing:2px">${stars}</div>
      </div>
    </div>
  </div>`;
}

function buildCaseStudyPdfHtml(s, bc) {
    const cs = s.caseStudy || {};
    const panels = [
        { label: 'Challenge', icon: '⚡', text: cs.challenge, bg: '#fef2f2', border: '#fca5a5' },
        { label: 'Solution', icon: '💡', text: cs.solution, bg: '#f0fdf4', border: '#86efac' },
        { label: 'Result', icon: '🎯', text: cs.result, bg: '#eff6ff', border: '#93c5fd' }
    ];
    let h = `<div style="margin-bottom:20px;page-break-inside:avoid;break-inside:avoid"><div style="font-size:14px;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid ${bc};color:${bc}">${esc(s.title)}</div>`;
    h += '<div style="display:flex;gap:12px">';
    panels.forEach(p => {
        h += `<div style="flex:1;background:${p.bg};border:1px solid ${p.border};border-radius:8px;padding:14px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#52525b;margin-bottom:6px">${p.icon} ${p.label}</div>
        <div style="font-size:12px;color:#3f3f46;line-height:1.6">${esc(p.text)}</div>
      </div>`;
    });
    h += '</div></div>';
    return h;
}

function buildStructuredSectionPdf(s, bc) {
    if (s.type === 'testimonial') return buildTestimonialPdfHtml(s, bc);
    if (s.type === 'case-study') return buildCaseStudyPdfHtml(s, bc);
    return '';
}
