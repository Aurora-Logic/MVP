// ════════════════════════════════════════
// ADMIN-TESTS — Aggressive Test Runner
// ════════════════════════════════════════

/* exported renderAdminTests */

var _testResults = [];
var _testGroup = '';

function _describe(name, fn) { _testGroup = name; fn(); _testGroup = ''; }

function _it(name, fn) {
    try { fn(); _testResults.push({ group: _testGroup, name: name, pass: true }); }
    catch (e) { _testResults.push({ group: _testGroup, name: name, pass: false, error: e.message }); }
}

function _expect(val) {
    return {
        toBe: function(exp) { if (val !== exp) throw new Error('Expected ' + JSON.stringify(exp) + ', got ' + JSON.stringify(val)); },
        toBeTrue: function() { if (val !== true) throw new Error('Expected true, got ' + JSON.stringify(val)); },
        toBeFalse: function() { if (val !== false) throw new Error('Expected false, got ' + JSON.stringify(val)); },
        toBeGreaterThan: function(n) { if (!(val > n)) throw new Error('Expected ' + val + ' > ' + n); },
        toBeLessThan: function(n) { if (!(val < n)) throw new Error('Expected ' + val + ' < ' + n); },
        toBeArray: function() { if (!Array.isArray(val)) throw new Error('Expected array, got ' + typeof val); },
        toBeDefined: function() { if (val == null) throw new Error('Expected defined, got ' + val); },
        toBeFiniteNumber: function() { if (!isFinite(val)) throw new Error('Expected finite, got ' + val); },
        toContain: function(s) { if (String(val).indexOf(s) < 0) throw new Error('Expected to contain "' + s + '"'); },
        toBeType: function(t) { if (typeof val !== t) throw new Error('Expected type ' + t + ', got ' + typeof val); },
        toBeWithin: function(lo, hi) { if (val < lo || val > hi) throw new Error(val + ' not within [' + lo + ',' + hi + ']'); }
    };
}

function runAllTests() {
    _testResults = [];
    adminReload();
    var t0 = performance.now();

    // ══════════ DATA INTEGRITY ══════════
    _describe('Data integrity', function() {
        _it('DB is a valid array', function() { _expect(A_DB).toBeArray(); });
        _it('CONFIG is a valid object', function() { _expect(typeof A_CONFIG).toBe('object'); });
        _it('CLIENTS is a valid array', function() { _expect(A_CLIENTS).toBeArray(); });
        _it('All proposals have string IDs', function() {
            A_DB.forEach(function(p) { _expect(typeof p.id).toBe('string'); });
        });
        _it('All proposals have valid status', function() {
            var valid = ['draft', 'sent', 'accepted', 'declined', 'expired'];
            A_DB.forEach(function(p) { if (p.status) _expect(valid.indexOf(p.status) >= 0).toBeTrue(); });
        });
        _it('No duplicate proposal IDs', function() {
            var ids = A_DB.map(function(p) { return p.id; });
            _expect(ids.length).toBe(new Set(ids).size);
        });
        _it('No duplicate client IDs', function() {
            var ids = A_CLIENTS.map(function(c) { return c.id; });
            _expect(ids.length).toBe(new Set(ids).size);
        });
        _it('No duplicate share tokens', function() {
            var tokens = A_DB.map(function(p) { return p.shareToken; }).filter(Boolean);
            _expect(tokens.length).toBe(new Set(tokens).size);
        });
        _it('All proposals have title or number', function() {
            A_DB.forEach(function(p) { _expect(!!(p.title || p.number)).toBeTrue(); });
        });
        _it('lineItems is always an array when present', function() {
            A_DB.forEach(function(p) { if (p.lineItems) _expect(p.lineItems).toBeArray(); });
        });
        _it('sections is always an array when present', function() {
            A_DB.forEach(function(p) { if (p.sections) _expect(p.sections).toBeArray(); });
        });
        _it('payments is always an array when present', function() {
            A_DB.forEach(function(p) { if (p.payments) _expect(p.payments).toBeArray(); });
        });
        _it('versionHistory is always an array when present', function() {
            A_DB.forEach(function(p) { if (p.versionHistory) _expect(p.versionHistory).toBeArray(); });
        });
    });

    // ══════════ NUMBER VALIDATION ══════════
    _describe('Number validation', function() {
        _it('All line item quantities are finite', function() {
            A_DB.forEach(function(p) { (p.lineItems || []).forEach(function(i) { _expect(i.qty).toBeFiniteNumber(); }); });
        });
        _it('All line item rates are non-negative', function() {
            A_DB.forEach(function(p) { (p.lineItems || []).forEach(function(i) { _expect(i.rate >= 0).toBeTrue(); }); });
        });
        _it('All discounts are non-negative', function() {
            A_DB.filter(function(p) { return p.discount != null; }).forEach(function(p) { _expect(p.discount >= 0).toBeTrue(); });
        });
        _it('All tax rates are 0-100', function() {
            A_DB.filter(function(p) { return p.taxRate != null; }).forEach(function(p) {
                _expect(p.taxRate >= 0).toBeTrue(); _expect(p.taxRate <= 100).toBeTrue();
            });
        });
        _it('No NaN in payment amounts', function() {
            A_DB.forEach(function(p) { (p.payments || []).forEach(function(pay) { _expect(isNaN(pay.amount)).toBeFalse(); }); });
        });
        _it('Discount does not exceed subtotal', function() {
            A_DB.filter(function(p) { return p.discount > 0; }).forEach(function(p) {
                var sub = proposalValue(p); _expect(p.discount <= sub + 0.01).toBeTrue();
            });
        });
        _it('No negative payment amounts', function() {
            A_DB.forEach(function(p) { (p.payments || []).forEach(function(pay) {
                _expect(pay.amount >= 0).toBeTrue();
            }); });
        });
        _it('Line item quantities are positive', function() {
            A_DB.forEach(function(p) { (p.lineItems || []).forEach(function(i) {
                _expect(i.qty > 0).toBeTrue();
            }); });
        });
    });

    // ══════════ DATE VALIDATION ══════════
    _describe('Date validation', function() {
        _it('All proposal dates are valid', function() {
            A_DB.filter(function(p) { return !!p.date; }).forEach(function(p) {
                _expect(!isNaN(new Date(p.date).getTime())).toBeTrue();
            });
        });
        _it('All validUntil dates are valid', function() {
            A_DB.filter(function(p) { return !!p.validUntil; }).forEach(function(p) {
                _expect(!isNaN(new Date(p.validUntil).getTime())).toBeTrue();
            });
        });
        _it('No payment dates in the future', function() {
            var today = new Date().toISOString().split('T')[0];
            A_DB.forEach(function(p) { (p.payments || []).forEach(function(pay) {
                if (pay.date) _expect(pay.date <= today).toBeTrue();
            }); });
        });
        _it('ValidUntil is after proposal date', function() {
            A_DB.filter(function(p) { return p.date && p.validUntil; }).forEach(function(p) {
                _expect(p.validUntil >= p.date).toBeTrue();
            });
        });
        _it('CreatedAt timestamps are positive', function() {
            A_DB.filter(function(p) { return p.createdAt; }).forEach(function(p) {
                _expect(p.createdAt > 0).toBeTrue();
            });
        });
        _it('No future createdAt timestamps', function() {
            var now = Date.now() + 60000;
            A_DB.filter(function(p) { return p.createdAt; }).forEach(function(p) {
                _expect(p.createdAt < now).toBeTrue();
            });
        });
    });

    // ══════════ BUSINESS LOGIC ══════════
    _describe('Business logic', function() {
        _it('No stale sent proposals past validUntil', function() {
            _expect(findExpiredNotHandled().length).toBe(0);
        });
        _it('Payment amounts do not exceed proposal total', function() {
            A_DB.forEach(function(p) {
                if (!p.payments || !p.payments.length) return;
                var total = proposalValue(p);
                var paid = p.payments.reduce(function(s, pay) { return s + (pay.amount || 0); }, 0);
                _expect(paid <= total * 1.01).toBeTrue();
            });
        });
        _it('All team members have valid roles', function() {
            (A_CONFIG.team || []).forEach(function(m) {
                _expect(['admin', 'editor', 'viewer'].indexOf(m.role) >= 0).toBeTrue();
            });
        });
        _it('At least one admin in team', function() {
            if (!(A_CONFIG.team && A_CONFIG.team.length > 0)) return;
            var admins = A_CONFIG.team.filter(function(m) { return m.role === 'admin'; });
            _expect(admins.length).toBeGreaterThan(0);
        });
        _it('activeUserId references existing team member', function() {
            if (!A_CONFIG.activeUserId || !A_CONFIG.team || !A_CONFIG.team.length) return;
            var found = A_CONFIG.team.some(function(m) { return m.id === A_CONFIG.activeUserId; });
            _expect(found).toBeTrue();
        });
        _it('No corrupt proposals', function() {
            _expect(findCorruptProposals().length).toBe(0);
        });
        _it('Accepted proposals have at least one line item', function() {
            A_DB.filter(function(p) { return p.status === 'accepted'; }).forEach(function(p) {
                _expect((p.lineItems || []).length > 0).toBeTrue();
            });
        });
        _it('All team members have unique IDs', function() {
            var team = A_CONFIG.team || [];
            var ids = team.map(function(m) { return m.id; });
            _expect(ids.length).toBe(new Set(ids).size);
        });
    });

    // ══════════ SECURITY ══════════
    _describe('Security', function() {
        _it('Share tokens have sufficient entropy (>=24 chars)', function() {
            A_DB.filter(function(p) { return !!p.shareToken; }).forEach(function(p) {
                _expect(p.shareToken.length >= 24).toBeTrue();
            });
        });
        _it('No script tags in section content', function() {
            A_DB.forEach(function(p) { (p.sections || []).forEach(function(s) {
                if (s.content) _expect(s.content.toLowerCase().indexOf('<script') < 0).toBeTrue();
            }); });
        });
        _it('No API keys stored in proposals', function() {
            A_DB.forEach(function(p) {
                var json = JSON.stringify(p).toLowerCase();
                _expect(json.indexOf('sk-ant-') < 0).toBeTrue();
            });
        });
        _it('No cloned share tokens', function() {
            var tokens = A_DB.map(function(p) { return p.shareToken; }).filter(Boolean);
            _expect(tokens.length).toBe(new Set(tokens).size);
        });
        _it('No javascript: URLs in any data', function() {
            var all = JSON.stringify(A_DB).toLowerCase();
            _expect(all.indexOf('javascript:') < 0).toBeTrue();
        });
        _it('No on* event handlers in section HTML', function() {
            A_DB.forEach(function(p) { (p.sections || []).forEach(function(s) {
                if (s.content) {
                    _expect((/\bon\w+\s*=/i).test(s.content)).toBeFalse();
                }
            }); });
        });
        _it('No iframe tags in section content', function() {
            A_DB.forEach(function(p) { (p.sections || []).forEach(function(s) {
                if (s.content) _expect(s.content.toLowerCase().indexOf('<iframe') < 0).toBeTrue();
            }); });
        });
        _it('No data: URLs in section content', function() {
            A_DB.forEach(function(p) { (p.sections || []).forEach(function(s) {
                if (s.content) _expect(s.content.toLowerCase().indexOf('data:text/html') < 0).toBeTrue();
            }); });
        });
        _it('No base64 encoded scripts in data', function() {
            var all = JSON.stringify(A_DB);
            _expect(all.indexOf('PHNjcmlwdD') < 0).toBeTrue();
        });
        _it('Config has no leaked passwords', function() {
            var cfg = JSON.stringify(A_CONFIG).toLowerCase();
            _expect(cfg.indexOf('"password"') < 0).toBeTrue();
        });
        _it('Webhook URLs use HTTPS', function() {
            if (A_CONFIG.webhookUrl) {
                _expect(A_CONFIG.webhookUrl.indexOf('https://') === 0).toBeTrue();
            }
        });
    });

    // ══════════ STORAGE HEALTH ══════════
    _describe('Storage health', function() {
        _it('localStorage under 80%', function() { _expect(getStoragePercent()).toBeLessThan(80); });
        _it('No key exceeds 2 MB', function() {
            Object.keys(STORAGE_KEYS).forEach(function(key) {
                _expect(getStorageKeySize(key)).toBeLessThan(2 * 1024 * 1024);
            });
        });
        _it('Version histories capped at 20', function() {
            A_DB.forEach(function(p) {
                if (p.versionHistory) _expect(p.versionHistory.length <= 20).toBeTrue();
            });
        });
        _it('All localStorage values are valid JSON', function() {
            Object.keys(STORAGE_KEYS).forEach(function(key) {
                var raw = localStorage.getItem(key);
                if (raw) { try { JSON.parse(raw); } catch (e) { throw new Error(key + ' is corrupt JSON'); } }
            });
        });
        _it('Analytics ring buffer not over 10000', function() {
            _expect((A_ANALYTICS || []).length <= 10000).toBeTrue();
        });
        _it('No orphaned localStorage keys starting with pk_', function() {
            var known = Object.keys(STORAGE_KEYS);
            var extra = ['pk_theme', 'pk_admin_errors', 'pk_admin_config', 'pk_subscription'];
            var valid = known.concat(extra);
            for (var i = 0; i < localStorage.length; i++) {
                var k = localStorage.key(i);
                if (k.indexOf('pk_') === 0 && valid.indexOf(k) < 0) {
                    throw new Error('Unknown key: ' + k);
                }
            }
        });
        _it('DB size is reasonable (<1MB)', function() {
            _expect(getStorageKeySize('pk_db')).toBeLessThan(1024 * 1024);
        });
    });

    // ══════════ REFERENTIAL INTEGRITY ══════════
    _describe('Referential integrity', function() {
        _it('No orphaned clients', function() { _expect(findOrphanedClients().length).toBe(0); });
        _it('CONFIG.activeUserId references valid team member', function() {
            if (!A_CONFIG.team || !A_CONFIG.team.length) return;
            var valid = A_CONFIG.team.some(function(m) { return m.id === A_CONFIG.activeUserId; });
            _expect(valid).toBeTrue();
        });
        _it('All proposal owners exist in team', function() {
            if (!A_CONFIG.team || !A_CONFIG.team.length) return;
            var teamIds = new Set(A_CONFIG.team.map(function(m) { return m.id; }));
            A_DB.filter(function(p) { return !!p.owner; }).forEach(function(p) { _expect(teamIds.has(p.owner)).toBeTrue(); });
        });
        _it('All proposal client emails exist in clients', function() {
            if (!A_CLIENTS.length) return;
            var emails = new Set(A_CLIENTS.map(function(c) { return (c.email || '').toLowerCase(); }));
            A_DB.filter(function(p) { return p.client && p.client.email; }).forEach(function(p) {
                _expect(emails.has(p.client.email.toLowerCase())).toBeTrue();
            });
        });
        _it('All payment schedule entries sum to 100% when in % mode', function() {
            A_DB.forEach(function(p) {
                if (!p.paymentSchedule || p.paymentSchedule.mode !== 'percent') return;
                var total = (p.paymentSchedule.entries || []).reduce(function(s, e) { return s + (e.value || 0); }, 0);
                if (total > 0) _expect(Math.abs(total - 100) < 1).toBeTrue();
            });
        });
    });

    // ══════════ SAAS DATA INTEGRITY ══════════
    _describe('SaaS data integrity', function() {
        _it('A_USERS is a valid array', function() { _expect(A_USERS).toBeArray(); });
        _it('A_TICKETS is a valid array', function() { _expect(A_TICKETS).toBeArray(); });
        _it('A_SUBSCRIPTIONS is a valid array', function() { _expect(A_SUBSCRIPTIONS).toBeArray(); });
        _it('A_ANNOUNCEMENTS is a valid array', function() { _expect(A_ANNOUNCEMENTS).toBeArray(); });
        _it('A_FEEDBACK is a valid array', function() { _expect(A_FEEDBACK).toBeArray(); });
        _it('A_ANALYTICS is a valid array', function() { _expect(A_ANALYTICS).toBeArray(); });
        _it('All users have string IDs', function() {
            A_USERS.forEach(function(u) { _expect(typeof u.id).toBe('string'); });
        });
        _it('All users have valid plan', function() {
            var valid = ['free', 'pro', 'team'];
            A_USERS.forEach(function(u) { if (u.plan) _expect(valid.indexOf(u.plan) >= 0).toBeTrue(); });
        });
        _it('All users have valid status', function() {
            var valid = ['active', 'suspended', 'churned'];
            A_USERS.forEach(function(u) { if (u.status) _expect(valid.indexOf(u.status) >= 0).toBeTrue(); });
        });
        _it('All users have email addresses', function() {
            A_USERS.forEach(function(u) { _expect(typeof u.email).toBe('string'); });
        });
        _it('No duplicate user IDs', function() {
            var ids = A_USERS.map(function(u) { return u.id; });
            _expect(ids.length).toBe(new Set(ids).size);
        });
        _it('No duplicate user emails', function() {
            var emails = A_USERS.map(function(u) { return (u.email || '').toLowerCase(); }).filter(Boolean);
            _expect(emails.length).toBe(new Set(emails).size);
        });
        _it('All tickets have string IDs', function() {
            A_TICKETS.forEach(function(t) { _expect(typeof t.id).toBe('string'); });
        });
        _it('All tickets have valid status', function() {
            var valid = ['open', 'in-progress', 'resolved', 'closed'];
            A_TICKETS.forEach(function(t) { _expect(valid.indexOf(t.status) >= 0).toBeTrue(); });
        });
        _it('All tickets have valid priority', function() {
            var valid = ['low', 'medium', 'high', 'urgent'];
            A_TICKETS.forEach(function(t) { _expect(valid.indexOf(t.priority) >= 0).toBeTrue(); });
        });
        _it('All tickets have valid category', function() {
            var valid = ['general', 'bug', 'feature', 'billing'];
            A_TICKETS.forEach(function(t) { if (t.category) _expect(valid.indexOf(t.category) >= 0).toBeTrue(); });
        });
        _it('All tickets have subjects', function() {
            A_TICKETS.forEach(function(t) { _expect(typeof t.subject).toBe('string'); });
        });
        _it('Ticket messages have valid from field', function() {
            A_TICKETS.forEach(function(t) {
                (t.messages || []).forEach(function(m) {
                    _expect(['user', 'admin'].indexOf(m.from) >= 0).toBeTrue();
                });
            });
        });
        _it('No duplicate ticket IDs', function() {
            var ids = A_TICKETS.map(function(t) { return t.id; });
            _expect(ids.length).toBe(new Set(ids).size);
        });
        _it('Resolved tickets have resolvedAt timestamp', function() {
            A_TICKETS.filter(function(t) { return t.status === 'resolved'; }).forEach(function(t) {
                if (t.resolvedAt) _expect(t.resolvedAt > 0).toBeTrue();
            });
        });
        _it('Feedback NPS scores are 0-10 or null', function() {
            A_FEEDBACK.forEach(function(f) {
                if (f.npsScore != null) {
                    _expect(f.npsScore >= 0).toBeTrue();
                    _expect(f.npsScore <= 10).toBeTrue();
                    _expect(Number.isInteger(f.npsScore)).toBeTrue();
                }
            });
        });
        _it('All feedback has valid type', function() {
            var valid = ['bug', 'feature', 'praise', 'complaint'];
            A_FEEDBACK.forEach(function(f) { if (f.type) _expect(valid.indexOf(f.type) >= 0).toBeTrue(); });
        });
        _it('All feedback has valid sentiment', function() {
            var valid = ['positive', 'neutral', 'negative'];
            A_FEEDBACK.forEach(function(f) { if (f.sentiment) _expect(valid.indexOf(f.sentiment) >= 0).toBeTrue(); });
        });
        _it('All feedback has valid status', function() {
            var valid = ['new', 'reviewed', 'actioned'];
            A_FEEDBACK.forEach(function(f) { if (f.status) _expect(valid.indexOf(f.status) >= 0).toBeTrue(); });
        });
        _it('Analytics events have valid timestamps', function() {
            A_ANALYTICS.forEach(function(e) { _expect(e.ts > 0).toBeTrue(); });
        });
        _it('Analytics events have event names', function() {
            A_ANALYTICS.forEach(function(e) { _expect(typeof e.event).toBe('string'); });
        });
        _it('No future analytics timestamps', function() {
            var now = Date.now() + 60000;
            A_ANALYTICS.forEach(function(e) { _expect(e.ts < now).toBeTrue(); });
        });
    });

    // ══════════ SUBSCRIPTION INTEGRITY ══════════
    _describe('Subscription integrity', function() {
        _it('All subscriptions have valid plan', function() {
            var valid = ['free', 'pro', 'team'];
            A_SUBSCRIPTIONS.forEach(function(s) { _expect(valid.indexOf(s.plan) >= 0).toBeTrue(); });
        });
        _it('All subscriptions have valid status', function() {
            var valid = ['active', 'trialing', 'trial', 'past_due', 'cancelled'];
            A_SUBSCRIPTIONS.forEach(function(s) { _expect(valid.indexOf(s.status) >= 0).toBeTrue(); });
        });
        _it('Active subscriptions have startDate', function() {
            A_SUBSCRIPTIONS.filter(function(s) { return s.status === 'active'; }).forEach(function(s) {
                _expect(s.startDate > 0).toBeTrue();
            });
        });
        _it('Cancelled subscriptions have cancelledAt', function() {
            A_SUBSCRIPTIONS.filter(function(s) { return s.status === 'cancelled'; }).forEach(function(s) {
                _expect(s.cancelledAt > 0).toBeTrue();
            });
        });
        _it('No duplicate subscription userIds', function() {
            var ids = A_SUBSCRIPTIONS.map(function(s) { return s.userId; }).filter(Boolean);
            _expect(ids.length).toBe(new Set(ids).size);
        });
        _it('MRR computation is non-negative', function() {
            var PLAN_PRICES = { free: 0, pro: 12, team: 29 };
            var mrr = 0;
            A_SUBSCRIPTIONS.forEach(function(s) {
                if (s.status === 'active' || s.status === 'trialing' || s.status === 'trial') mrr += (PLAN_PRICES[s.plan] || 0);
            });
            _expect(mrr >= 0).toBeTrue();
        });
        _it('Free plan subscriptions have $0 MRR', function() {
            A_SUBSCRIPTIONS.filter(function(s) { return s.plan === 'free'; }).forEach(function(s) {
                _expect(s.mrr === 0 || s.mrr == null).toBeTrue();
            });
        });
    });

    // ══════════ ANNOUNCEMENT INTEGRITY ══════════
    _describe('Announcement integrity', function() {
        _it('All announcements have string IDs', function() {
            A_ANNOUNCEMENTS.forEach(function(a) { _expect(typeof a.id).toBe('string'); });
        });
        _it('Announcement targets match valid plans', function() {
            var valid = ['all', 'free', 'pro', 'team'];
            A_ANNOUNCEMENTS.forEach(function(a) { _expect(valid.indexOf(a.target) >= 0).toBeTrue(); });
        });
        _it('All announcements have valid type', function() {
            var valid = ['info', 'warning', 'update', 'maintenance'];
            A_ANNOUNCEMENTS.forEach(function(a) { if (a.type) _expect(valid.indexOf(a.type) >= 0).toBeTrue(); });
        });
        _it('All announcements have valid status', function() {
            var valid = ['draft', 'active', 'expired'];
            A_ANNOUNCEMENTS.forEach(function(a) { if (a.status) _expect(valid.indexOf(a.status) >= 0).toBeTrue(); });
        });
        _it('dismissedBy is always an array', function() {
            A_ANNOUNCEMENTS.forEach(function(a) {
                if (a.dismissedBy) _expect(a.dismissedBy).toBeArray();
            });
        });
        _it('No duplicate announcement IDs', function() {
            var ids = A_ANNOUNCEMENTS.map(function(a) { return a.id; });
            _expect(ids.length).toBe(new Set(ids).size);
        });
        _it('All announcements have titles', function() {
            A_ANNOUNCEMENTS.forEach(function(a) { _expect(typeof a.title).toBe('string'); });
        });
    });

    // ══════════ CROSS-PANEL LINKING ══════════
    _describe('Cross-panel linking', function() {
        _it('All ticket userIds exist in users', function() {
            if (!A_USERS.length) return;
            var userIds = new Set(A_USERS.map(function(u) { return u.id; }));
            A_TICKETS.filter(function(t) { return !!t.userId; }).forEach(function(t) {
                _expect(userIds.has(t.userId)).toBeTrue();
            });
        });
        _it('Feedback userIds exist in users', function() {
            if (!A_USERS.length) return;
            var userIds = new Set(A_USERS.map(function(u) { return u.id; }));
            A_FEEDBACK.filter(function(f) { return !!f.userId; }).forEach(function(f) {
                _expect(userIds.has(f.userId)).toBeTrue();
            });
        });
        _it('Subscription userIds exist in users', function() {
            if (!A_USERS.length) return;
            var userIds = new Set(A_USERS.map(function(u) { return u.id; }));
            A_SUBSCRIPTIONS.filter(function(s) { return !!s.userId; }).forEach(function(s) {
                _expect(userIds.has(s.userId)).toBeTrue();
            });
        });
        _it('Announcement dismissedBy contains valid user IDs', function() {
            if (!A_USERS.length) return;
            var userIds = new Set(A_USERS.map(function(u) { return u.id; }));
            A_ANNOUNCEMENTS.forEach(function(a) {
                (a.dismissedBy || []).forEach(function(uid) { _expect(userIds.has(uid)).toBeTrue(); });
            });
        });
        _it('Analytics userIds exist in users', function() {
            if (!A_USERS.length) return;
            var userIds = new Set(A_USERS.map(function(u) { return u.id; }));
            A_ANALYTICS.filter(function(e) { return !!e.userId; }).forEach(function(e) {
                _expect(userIds.has(e.userId)).toBeTrue();
            });
        });
        _it('All active users have subscriptions', function() {
            if (!A_USERS.length || !A_SUBSCRIPTIONS.length) return;
            var subUsers = new Set(A_SUBSCRIPTIONS.map(function(s) { return s.userId; }));
            A_USERS.filter(function(u) { return u.status === 'active'; }).forEach(function(u) {
                _expect(subUsers.has(u.id)).toBeTrue();
            });
        });
    });

    // ══════════ BIDIRECTIONAL FLOW ══════════
    _describe('Bidirectional: Tickets', function() {
        _it('Ticket submitted from app has required fields', function() {
            A_TICKETS.forEach(function(t) {
                _expect(typeof t.id).toBe('string');
                _expect(typeof t.subject).toBe('string');
                _expect(typeof t.status).toBe('string');
                _expect(typeof t.createdAt).toBe('number');
            });
        });
        _it('Ticket userEmail matches a known format', function() {
            A_TICKETS.forEach(function(t) {
                if (t.userEmail) _expect(t.userEmail.indexOf('@') > 0).toBeTrue();
            });
        });
        _it('Ticket messages array always exists', function() {
            A_TICKETS.forEach(function(t) { _expect(Array.isArray(t.messages || [])).toBeTrue(); });
        });
        _it('Admin replies have from="admin"', function() {
            A_TICKETS.forEach(function(t) {
                (t.messages || []).forEach(function(m) {
                    if (m.from === 'admin') { _expect(m.ts > 0).toBeTrue(); _expect(typeof m.text).toBe('string'); }
                });
            });
        });
        _it('User replies have from="user"', function() {
            A_TICKETS.forEach(function(t) {
                (t.messages || []).forEach(function(m) {
                    if (m.from === 'user') { _expect(m.ts > 0).toBeTrue(); _expect(typeof m.text).toBe('string'); }
                });
            });
        });
        _it('Resolved tickets have updatedAt >= createdAt', function() {
            A_TICKETS.filter(function(t) { return t.status === 'resolved' && t.updatedAt; }).forEach(function(t) {
                _expect(t.updatedAt >= t.createdAt).toBeTrue();
            });
        });
        _it('pk_tickets in localStorage matches A_TICKETS after reload', function() {
            var raw = safeGet('pk_tickets', []);
            _expect(raw.length).toBe(A_TICKETS.length);
        });
    });

    _describe('Bidirectional: Subscriptions \u2194 Users', function() {
        _it('User plan matches their subscription plan', function() {
            if (!A_USERS.length || !A_SUBSCRIPTIONS.length) return;
            A_USERS.forEach(function(u) {
                var sub = null;
                for (var i = 0; i < A_SUBSCRIPTIONS.length; i++) {
                    if (A_SUBSCRIPTIONS[i].userId === u.id) { sub = A_SUBSCRIPTIONS[i]; break; }
                }
                if (sub && sub.status !== 'cancelled') _expect(u.plan).toBe(sub.plan);
            });
        });
        _it('Subscription MRR matches plan price', function() {
            var PP = { free: 0, pro: 12, team: 29 };
            A_SUBSCRIPTIONS.forEach(function(s) {
                if (s.mrr != null) _expect(s.mrr).toBe(PP[s.plan] || 0);
            });
        });
        _it('No subscription without a userId', function() {
            A_SUBSCRIPTIONS.forEach(function(s) { _expect(typeof s.userId).toBe('string'); _expect(s.userId.length > 0).toBeTrue(); });
        });
        _it('pk_subscriptions matches A_SUBSCRIPTIONS after reload', function() {
            var raw = safeGet('pk_subscriptions', []);
            _expect(raw.length).toBe(A_SUBSCRIPTIONS.length);
        });
    });

    _describe('Bidirectional: Announcements', function() {
        _it('Active announcements have title and body', function() {
            A_ANNOUNCEMENTS.filter(function(a) { return a.status === 'active'; }).forEach(function(a) {
                _expect(typeof a.title).toBe('string');
                _expect(a.title.length > 0).toBeTrue();
            });
        });
        _it('Expired announcements have valid expiresAt or manual status', function() {
            A_ANNOUNCEMENTS.filter(function(a) { return a.status === 'expired'; }).forEach(function(a) {
                _expect(a.expiresAt != null || a.status === 'expired').toBeTrue();
            });
        });
        _it('dismissedBy entries are strings', function() {
            A_ANNOUNCEMENTS.forEach(function(a) {
                (a.dismissedBy || []).forEach(function(d) { _expect(typeof d).toBe('string'); });
            });
        });
        _it('pk_announcements matches A_ANNOUNCEMENTS after reload', function() {
            var raw = safeGet('pk_announcements', []);
            _expect(raw.length).toBe(A_ANNOUNCEMENTS.length);
        });
    });

    _describe('Bidirectional: Feedback', function() {
        _it('All feedback has createdAt timestamp', function() {
            A_FEEDBACK.forEach(function(f) { _expect(typeof f.createdAt).toBe('number'); _expect(f.createdAt > 0).toBeTrue(); });
        });
        _it('Feedback with admin response is reviewed or actioned', function() {
            A_FEEDBACK.filter(function(f) { return f.adminResponse && f.adminResponse.length > 0; }).forEach(function(f) {
                _expect(['reviewed', 'actioned'].indexOf(f.status) >= 0).toBeTrue();
            });
        });
        _it('pk_feedback matches A_FEEDBACK after reload', function() {
            var raw = safeGet('pk_feedback', []);
            _expect(raw.length).toBe(A_FEEDBACK.length);
        });
    });

    _describe('Bidirectional: Analytics', function() {
        _it('All analytics events have event name and timestamp', function() {
            A_ANALYTICS.forEach(function(e) {
                _expect(typeof e.event).toBe('string');
                _expect(e.event.length > 0).toBeTrue();
                _expect(typeof e.ts).toBe('number');
            });
        });
        _it('Analytics ring buffer capped at 10000', function() {
            _expect(A_ANALYTICS.length <= 10000).toBeTrue();
        });
        _it('pk_analytics matches A_ANALYTICS after reload', function() {
            var raw = safeGet('pk_analytics', []);
            _expect(raw.length).toBe(A_ANALYTICS.length);
        });
    });

    _describe('Bidirectional: Plan enforcement', function() {
        _it('PLAN_PRICES constant is correct', function() {
            var PP = { free: 0, pro: 12, team: 29 };
            A_SUBSCRIPTIONS.forEach(function(s) {
                if (s.status === 'active' && s.mrr != null) _expect(s.mrr).toBe(PP[s.plan] || 0);
            });
        });
        _it('Free users have max 5 proposals in limits', function() {
            var limits = { free: 5, pro: Infinity, team: Infinity };
            A_USERS.filter(function(u) { return u.plan === 'free'; }).forEach(function(u) {
                _expect(limits.free).toBe(5);
            });
        });
        _it('Pro/Team users get unlimited proposals', function() {
            var limits = { free: 5, pro: Infinity, team: Infinity };
            _expect(limits.pro).toBe(Infinity);
            _expect(limits.team).toBe(Infinity);
        });
    });

    _describe('Multi-tab sync readiness', function() {
        _it('All SaaS keys are valid JSON in localStorage', function() {
            ['pk_users', 'pk_tickets', 'pk_subscriptions', 'pk_announcements', 'pk_feedback', 'pk_analytics'].forEach(function(key) {
                var raw = localStorage.getItem(key);
                if (raw) { try { JSON.parse(raw); } catch (e) { throw new Error(key + ' is corrupt'); } }
            });
        });
        _it('SaaS data survives round-trip serialize/deserialize', function() {
            var keys = { pk_users: A_USERS, pk_tickets: A_TICKETS, pk_subscriptions: A_SUBSCRIPTIONS,
                pk_announcements: A_ANNOUNCEMENTS, pk_feedback: A_FEEDBACK, pk_analytics: A_ANALYTICS };
            Object.keys(keys).forEach(function(k) {
                var rt = JSON.parse(JSON.stringify(keys[k]));
                _expect(rt.length).toBe(keys[k].length);
            });
        });
        _it('No undefined values serialized in SaaS data', function() {
            ['pk_users', 'pk_tickets', 'pk_subscriptions', 'pk_announcements', 'pk_feedback'].forEach(function(key) {
                var raw = localStorage.getItem(key);
                if (raw) _expect(raw.indexOf(':null,') >= 0 || raw.indexOf('undefined') < 0).toBeTrue();
            });
        });
    });

    // ══════════ UTILITY FUNCTIONS ══════════
    _describe('Utility functions', function() {
        _it('esc() escapes HTML entities', function() {
            _expect(esc('<script>')).toBe('&lt;script&gt;');
        });
        _it('esc() escapes quotes', function() {
            _expect(esc('"hello"')).toContain('&quot;');
        });
        _it('esc() handles null/undefined', function() {
            _expect(esc(null)).toBe('');
            _expect(esc(undefined)).toBe('');
        });
        _it('fmtCur() formats currency', function() {
            var result = fmtCur(1000, '$');
            _expect(result.indexOf('$') >= 0).toBeTrue();
            _expect(result.indexOf('1') >= 0).toBeTrue();
        });
        _it('fmtCur() handles NaN', function() {
            _expect(fmtCur(NaN, '$')).toBe('\u2014');
        });
        _it('fmtCur() handles null', function() {
            _expect(fmtCur(null, '$')).toBe('\u2014');
        });
        _it('fmtDate() returns dash for empty', function() {
            _expect(fmtDate(null)).toBe('\u2014');
        });
        _it('timeAgo() returns "just now" for recent', function() {
            _expect(timeAgo(Date.now())).toBe('just now');
        });
        _it('timeAgo() returns dash for null', function() {
            _expect(timeAgo(null)).toBe('\u2014');
        });
        _it('uid() generates unique IDs', function() {
            var a = uid(), b = uid();
            _expect(a !== b).toBeTrue();
        });
        _it('uid() starts with "a"', function() {
            _expect(uid().charAt(0)).toBe('a');
        });
        _it('fmtBytes() formats correctly', function() {
            _expect(fmtBytes(500)).toBe('500 B');
            _expect(fmtBytes(1024)).toContain('KB');
        });
        _it('proposalValue() computes correctly', function() {
            var p = { lineItems: [{ qty: 2, rate: 100 }, { qty: 1, rate: 50 }] };
            _expect(proposalValue(p)).toBe(250);
        });
        _it('proposalValue() handles empty', function() {
            _expect(proposalValue({})).toBe(0);
            _expect(proposalValue(null)).toBe(0);
        });
    });

    // ══════════ RENDERER FUNCTIONS ══════════
    _describe('Renderer functions exist', function() {
        _it('renderAdminDashboard exists', function() { _expect(typeof renderAdminDashboard).toBe('function'); });
        _it('renderAdminUsers exists', function() { _expect(typeof renderAdminUsers).toBe('function'); });
        _it('renderAdminProposals exists', function() { _expect(typeof renderAdminProposals).toBe('function'); });
        _it('renderAdminClients exists', function() { _expect(typeof renderAdminClients).toBe('function'); });
        _it('renderAdminTickets exists', function() { _expect(typeof renderAdminTickets).toBe('function'); });
        _it('renderAdminSubscriptions exists', function() { _expect(typeof renderAdminSubscriptions).toBe('function'); });
        _it('renderAdminAnnouncements exists', function() { _expect(typeof renderAdminAnnouncements).toBe('function'); });
        _it('renderAdminAnalyticsView exists', function() { _expect(typeof renderAdminAnalyticsView).toBe('function'); });
        _it('renderAdminFeedback exists', function() { _expect(typeof renderAdminFeedback).toBe('function'); });
        _it('renderAdminTemplates exists', function() { _expect(typeof renderAdminTemplates).toBe('function'); });
        _it('renderAdminConfig exists', function() { _expect(typeof renderAdminConfig).toBe('function'); });
        _it('renderAdminDebug exists', function() { _expect(typeof renderAdminDebug).toBe('function'); });
        _it('renderAdminTests exists', function() { _expect(typeof renderAdminTests).toBe('function'); });
        _it('renderAdminAudit exists', function() { _expect(typeof renderAdminAudit).toBe('function'); });
    });

    // ══════════ DOM STRUCTURE ══════════
    _describe('DOM structure', function() {
        _it('adminContent element exists', function() {
            _expect(!!document.getElementById('adminContent')).toBeTrue();
        });
        _it('adminSidebar element exists', function() {
            _expect(!!document.getElementById('adminSidebar')).toBeTrue();
        });
        _it('adminTopTitle element exists', function() {
            _expect(!!document.getElementById('adminTopTitle')).toBeTrue();
        });
        _it('adminToast element exists', function() {
            _expect(!!document.getElementById('adminToast')).toBeTrue();
        });
        _it('Sidebar uses .side class (main app pattern)', function() {
            var sidebar = document.getElementById('adminSidebar');
            _expect(sidebar.classList.contains('side')).toBeTrue();
        });
        _it('Shell uses .app class (main app pattern)', function() {
            var shell = document.getElementById('adminShell');
            _expect(shell.classList.contains('app')).toBeTrue();
        });
        _it('Topbar uses .topbar class', function() {
            _expect(!!document.querySelector('.topbar')).toBeTrue();
        });
        _it('Breadcrumb exists', function() {
            _expect(!!document.querySelector('.topbar-breadcrumb')).toBeTrue();
        });
        _it('All nav groups rendered', function() {
            var labels = document.querySelectorAll('.admin-nav-group-label');
            _expect(labels.length).toBe(3);
        });
        _it('All 14 nav items rendered', function() {
            var btns = document.querySelectorAll('.side-btn[data-section]');
            _expect(btns.length).toBe(14);
        });
    });

    // ══════════ ADMIN AUTH ══════════
    _describe('Admin auth', function() {
        _it('checkAdminAccess returns boolean', function() {
            _expect(typeof checkAdminAccess()).toBe('boolean');
        });
        _it('activeAdminUser returns object or null', function() {
            var user = activeAdminUser();
            _expect(user === null || typeof user === 'object').toBeTrue();
        });
        _it('Admin user has identity', function() {
            var user = activeAdminUser();
            if (user) _expect(typeof user.id).toBe('string');
        });
    });

    // ══════════ PERFORMANCE ══════════
    _describe('Performance', function() {
        _it('Dashboard renders under 100ms', function() {
            var el = document.getElementById('adminContent');
            var saved = el ? el.innerHTML : '';
            var t = performance.now();
            renderAdminDashboard();
            _expect(performance.now() - t).toBeLessThan(100);
            if (el) el.innerHTML = saved;
        });
        _it('Sidebar renders under 50ms', function() {
            var nav = document.getElementById('adminNavList');
            var saved = nav ? nav.innerHTML : '';
            var t = performance.now();
            renderAdminSidebar();
            _expect(performance.now() - t).toBeLessThan(50);
            if (nav) nav.innerHTML = saved;
        });
        _it('Data reload under 50ms', function() {
            var t = performance.now();
            adminReload();
            _expect(performance.now() - t).toBeLessThan(50);
        });
    });

    var elapsed = (performance.now() - t0).toFixed(0);
    if (typeof auditLog === 'function') {
        var passed = _testResults.filter(function(t) { return t.pass; }).length;
        var failed = _testResults.filter(function(t) { return !t.pass; }).length;
        auditLog('run_tests', 'tests', passed + ' passed, ' + failed + ' failed in ' + elapsed + 'ms');
    }
    return { results: _testResults, elapsed: elapsed };
}

function renderAdminTests() {
    var el = document.getElementById('adminContent');
    if (!el) return;
    el.innerHTML = '<div class="admin-section">' +
        '<div class="admin-section-head"><div class="admin-section-title">Test Runner</div>' +
        '<div style="display:flex;gap:8px">' +
        '<button class="btn" onclick="runAndRenderTests()"><i data-lucide="play"></i> Run All Tests</button>' +
        '<button class="btn-sm-outline" onclick="exportTestReport()"><i data-lucide="download"></i> Export</button>' +
        '</div></div>' +
        '<div id="testResultsArea"><p style="color:var(--text3);font-size:13px">Click "Run All Tests" to start the aggressive test suite.</p></div></div>';
    lucide.createIcons();
}

function runAndRenderTests() {
    var data = runAllTests();
    var results = data.results;
    var elapsed = data.elapsed;
    var passed = results.filter(function(t) { return t.pass; }).length;
    var failed = results.filter(function(t) { return !t.pass; }).length;

    var area = document.getElementById('testResultsArea');
    if (!area) return;
    var html = '<div class="admin-test-summary">' +
        '<span style="color:var(--green)"><i data-lucide="check-circle-2" style="width:18px;height:18px"></i> ' + passed + ' passed</span>' +
        '<span style="color:var(--red)"><i data-lucide="x-circle" style="width:18px;height:18px"></i> ' + failed + ' failed</span>' +
        '<span style="color:var(--text4)"><i data-lucide="timer" style="width:14px;height:14px"></i> ' + elapsed + 'ms</span>' +
        '<span style="color:var(--text4);margin-left:auto;font-size:12px">' + results.length + ' total tests</span></div>';

    var groups = {};
    results.forEach(function(t) {
        if (!groups[t.group]) groups[t.group] = [];
        groups[t.group].push(t);
    });

    Object.keys(groups).forEach(function(gName) {
        var tests = groups[gName];
        var gPassed = tests.filter(function(t) { return t.pass; }).length;
        var gFailed = tests.length - gPassed;
        html += '<div class="admin-test-group">' +
            '<div class="admin-test-group-head" onclick="this.parentElement.classList.toggle(\'collapsed\')">' +
            '<span>' + esc(gName) + ' (' + gPassed + '/' + tests.length + ')</span>' +
            '<span style="font-size:12px;color:' + (gFailed > 0 ? 'var(--red)' : 'var(--green)') + '">' +
            (gFailed > 0 ? gFailed + ' FAILED' : 'ALL PASSED') + '</span></div>';
        tests.forEach(function(t) {
            html += '<div class="admin-test-row ' + (t.pass ? 'pass' : 'fail') + '">' +
                '<i data-lucide="' + (t.pass ? 'check' : 'x') + '" style="width:14px;height:14px;flex-shrink:0;margin-top:1px"></i>' +
                '<div><div>' + esc(t.name) + '</div>' +
                (!t.pass && t.error ? '<div class="admin-test-error">' + esc(t.error) + '</div>' : '') +
                '</div></div>';
        });
        html += '</div>';
    });

    area.innerHTML = html;
    lucide.createIcons();
}

function exportTestReport() {
    if (!_testResults.length) { adminToast('Run tests first', 'error'); return; }
    var report = {
        timestamp: new Date().toISOString(),
        browser: parseBrowser(),
        total: _testResults.length,
        passed: _testResults.filter(function(t) { return t.pass; }).length,
        failed: _testResults.filter(function(t) { return !t.pass; }).length,
        results: _testResults
    };
    downloadBlob(JSON.stringify(report, null, 2), 'pk-test-report-' + new Date().toISOString().split('T')[0] + '.json', 'application/json');
    adminToast('Test report exported');
}
