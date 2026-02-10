// ════════════════════════════════════════
// LANDING PAGE — Interactions & animations
// ════════════════════════════════════════

function toggleFaq(el) {
    const i = el.parentElement;
    const w = i.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(x => x.classList.remove('open'));
    if (!w) i.classList.add('open');
}

function setCurrency(c, b) {
    document.querySelectorAll('.cur-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    document.querySelectorAll('[data-usd]').forEach(el => {
        el.textContent = el.dataset[c] || el.dataset.usd;
    });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        e.preventDefault();
        const t = document.querySelector(a.getAttribute('href'));
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// Reveal on scroll
const ro = new IntersectionObserver(es => {
    es.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add('visible');
            ro.unobserve(e.target);
        }
    });
}, { threshold: .1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => ro.observe(el));

// Nav scroll effect
const nav = document.getElementById('mainNav');
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 40);
    lastScroll = y;
}, { passive: true });

// Active nav link on scroll
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');
const sro = new IntersectionObserver(es => {
    es.forEach(e => {
        if (e.isIntersecting) {
            const id = e.target.getAttribute('id');
            navLinks.forEach(a => {
                a.classList.toggle('active', a.getAttribute('href') === '#' + id);
            });
        }
    });
}, { threshold: 0, rootMargin: '-40% 0px -55% 0px' });
sections.forEach(s => sro.observe(s));

// Mobile menu
function toggleMobileMenu() {
    document.getElementById('navMobile').classList.toggle('open');
}
function closeMobileMenu() {
    document.getElementById('navMobile').classList.remove('open');
}
document.addEventListener('click', e => {
    if (!e.target.closest('.nav-pill')) closeMobileMenu();
});
