// ════════════════════════════════════════
// SYNC — Cloud sync layer (Supabase)
// ════════════════════════════════════════

let syncTimer = null;
const SYNC_DEBOUNCE = 2000;

function syncEnabled() {
    return isLoggedIn() && navigator.onLine && sb();
}

// ════════════════════════════════════════
// PUSH — Save to cloud after local save
// ════════════════════════════════════════

function syncAfterPersist() {
    if (!syncEnabled()) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => pushProposals(), SYNC_DEBOUNCE);
}

function syncAfterSaveConfig() {
    if (!syncEnabled()) return;
    pushConfig();
}

function syncAfterSaveClients() {
    if (!syncEnabled()) return;
    pushClients();
}

async function pushProposals() {
    if (!syncEnabled()) return;
    setSyncStatus('syncing');
    try {
        const user = await getUser();
        if (!user) { setSyncStatus('error'); return; }
        const proposals = DB.map(p => ({
            id: p.id,
            user_id: user.id,
            data: p,
            status: p.status || 'draft',
            share_token: p.shareToken || null,
            updated_at: new Date(p.updatedAt || Date.now()).toISOString()
        }));
        // Upsert in batches of 20
        for (let i = 0; i < proposals.length; i += 20) {
            const batch = proposals.slice(i, i + 20);
            const { error } = await sb().from('proposals')
                .upsert(batch, { onConflict: 'id,user_id' });
            if (error) { console.error('Proposal sync error:', error); setSyncStatus('error'); return; }
        }
        // Delete proposals that exist in cloud but not locally
        const { data: cloudIds } = await sb().from('proposals')
            .select('id').eq('user_id', user.id);
        if (cloudIds) {
            const localIds = new Set(DB.map(p => p.id));
            const toDelete = cloudIds.filter(c => !localIds.has(c.id)).map(c => c.id);
            if (toDelete.length) {
                await sb().from('proposals')
                    .delete().eq('user_id', user.id).in('id', toDelete);
            }
        }
        setSyncStatus('synced');
    } catch (e) {
        console.error('Proposal push failed:', e);
        setSyncStatus('error');
    }
}

async function pushConfig() {
    if (!syncEnabled() || !CONFIG) return;
    try {
        const user = await getUser();
        if (!user) return;
        await sb().from('configs').upsert({
            user_id: user.id,
            data: CONFIG,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
    } catch (e) { console.error('Config push failed:', e); }
}

async function pushClients() {
    if (!syncEnabled()) return;
    try {
        const user = await getUser();
        if (!user) return;
        // Replace all clients for this user
        await sb().from('clients').delete().eq('user_id', user.id);
        if (CLIENTS.length) {
            const rows = CLIENTS.map(c => ({
                user_id: user.id,
                data: c,
                updated_at: new Date().toISOString()
            }));
            await sb().from('clients').insert(rows);
        }
    } catch (e) { console.error('Clients push failed:', e); }
}

async function pushLibraries() {
    if (!syncEnabled()) return;
    try {
        const user = await getUser();
        if (!user) return;
        const libs = [
            { type: 'sections', key: 'pk_seclib' },
            { type: 'tc', key: 'pk_tclib' },
            { type: 'email_templates', key: 'pk_email_tpl' },
            { type: 'proposal_templates', key: 'pk_templates' }
        ];
        for (const lib of libs) {
            const data = safeGetStorage(lib.key, []);
            await sb().from('libraries').upsert({
                user_id: user.id,
                type: lib.type,
                data: data,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,type' });
        }
    } catch (e) { console.error('Libraries push failed:', e); }
}

// ════════════════════════════════════════
// PULL — Load from cloud
// ════════════════════════════════════════

async function pullFromCloud() {
    if (!sb() || !isLoggedIn()) return;
    setSyncStatus('syncing');
    try {
        const user = await getUser();
        if (!user) { setSyncStatus('error'); return; }

        // Pull proposals
        const { data: cloudProposals } = await sb().from('proposals')
            .select('id, data, updated_at').eq('user_id', user.id);
        if (cloudProposals && cloudProposals.length) {
            const merged = mergeProposals(DB, cloudProposals.map(r => r.data));
            DB = merged;
            localStorage.setItem('pk_db', JSON.stringify(DB));
        } else if (!cloudProposals || !cloudProposals.length) {
            // Cloud empty, local has data — push up
            if (DB.length) await pushProposals();
        }

        // Pull config
        const { data: cloudConfig } = await sb().from('configs')
            .select('data').eq('user_id', user.id).single();
        if (cloudConfig?.data) {
            if (CONFIG) {
                // Merge: cloud fields win, but keep local fields that cloud doesn't have
                CONFIG = { ...CONFIG, ...cloudConfig.data };
            } else {
                CONFIG = cloudConfig.data;
            }
            localStorage.setItem('pk_config', JSON.stringify(CONFIG));
        } else if (CONFIG) {
            // Cloud empty, push local config up
            await pushConfig();
        }

        // Pull clients
        const { data: cloudClients } = await sb().from('clients')
            .select('data').eq('user_id', user.id);
        if (cloudClients && cloudClients.length) {
            const remoteClients = cloudClients.map(r => r.data);
            CLIENTS = mergeClients(CLIENTS, remoteClients);
            localStorage.setItem('pk_clients', JSON.stringify(CLIENTS));
        } else if (CLIENTS.length) {
            await pushClients();
        }

        // Pull libraries
        const { data: cloudLibs } = await sb().from('libraries')
            .select('type, data').eq('user_id', user.id);
        if (cloudLibs && cloudLibs.length) {
            const libMap = { sections: 'pk_seclib', tc: 'pk_tclib', email_templates: 'pk_email_tpl', proposal_templates: 'pk_templates' };
            cloudLibs.forEach(lib => {
                const key = libMap[lib.type];
                if (key && Array.isArray(lib.data)) {
                    localStorage.setItem(key, JSON.stringify(lib.data));
                }
            });
        } else {
            await pushLibraries();
        }

        setSyncStatus('synced');
    } catch (e) {
        console.error('Pull from cloud failed:', e);
        setSyncStatus('error');
    }
}

// Full push — used for first-time migration
async function pushToCloud() {
    if (!syncEnabled()) return;
    setSyncStatus('syncing');
    try {
        await pushProposals();
        await pushConfig();
        await pushClients();
        await pushLibraries();
        setSyncStatus('synced');
    } catch (e) {
        console.error('Push to cloud failed:', e);
        setSyncStatus('error');
    }
}

// ════════════════════════════════════════
// MERGE — Conflict resolution
// ════════════════════════════════════════

function mergeProposals(local, remote) {
    const map = new Map();
    // Add all local proposals
    local.forEach(p => map.set(p.id, p));
    // Merge remote: keep newer by updatedAt
    remote.forEach(rp => {
        const lp = map.get(rp.id);
        if (!lp) {
            map.set(rp.id, rp); // new from cloud
        } else {
            const lt = lp.updatedAt || lp.createdAt || 0;
            const rt = rp.updatedAt || rp.createdAt || 0;
            if (rt > lt) map.set(rp.id, rp); // cloud is newer
        }
    });
    // Sort by createdAt desc (newest first)
    return Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function mergeClients(local, remote) {
    const map = new Map();
    local.forEach(c => map.set(c.email || c.name, c));
    remote.forEach(c => {
        const key = c.email || c.name;
        if (!map.has(key)) map.set(key, c);
    });
    return Array.from(map.values());
}

// ════════════════════════════════════════
// ONLINE/OFFLINE LISTENER
// ════════════════════════════════════════

window.addEventListener('online', () => {
    if (isLoggedIn()) {
        setSyncStatus('syncing');
        pushToCloud();
    }
});

window.addEventListener('offline', () => {
    if (isLoggedIn()) setSyncStatus('offline');
});
