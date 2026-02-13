#!/usr/bin/env node

// ════════════════════════════════════════
// SERVICE WORKER v25 - Automated Tests
// ════════════════════════════════════════
// Run: node test-sw.js

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const tests = [];
let passed = 0;
let failed = 0;

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  log('\n🧪 Service Worker v25 Test Suite\n', 'bold');
  log('Testing: ' + BASE_URL + '\n', 'cyan');

  for (const t of tests) {
    try {
      await t.fn();
      log(`✓ ${t.name}`, 'green');
      passed++;
    } catch (err) {
      log(`✗ ${t.name}`, 'red');
      log(`  ${err.message}`, 'red');
      failed++;
    }
  }

  log('\n' + '='.repeat(60), 'cyan');
  log(`\nResults: ${passed} passed, ${failed} failed (${tests.length} total)\n`, 'bold');

  if (failed === 0) {
    log('🎉 All tests passed!', 'green');
    process.exit(0);
  } else {
    log('❌ Some tests failed', 'red');
    process.exit(1);
  }
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

// ══════════════════════════════════════════
// TEST CASES
// ══════════════════════════════════════════

test('Service Worker file exists', async () => {
  const swPath = path.join(__dirname, 'sw.js');
  if (!fs.existsSync(swPath)) {
    throw new Error('sw.js not found');
  }
});

test('Service Worker version is v25', async () => {
  const swPath = path.join(__dirname, 'sw.js');
  const content = fs.readFileSync(swPath, 'utf8');

  if (!content.includes('proposalkit-v25') && !content.includes('CACHE_VERSION = 25')) {
    throw new Error('Not version v25');
  }

  if (!content.includes('CACHE_VERSION = 25')) {
    throw new Error('CACHE_VERSION constant not set to 25');
  }
});

test('Service Worker has cache size limit', async () => {
  const swPath = path.join(__dirname, 'sw.js');
  const content = fs.readFileSync(swPath, 'utf8');

  if (!content.includes('MAX_CACHE_SIZE')) {
    throw new Error('MAX_CACHE_SIZE not defined');
  }

  const match = content.match(/MAX_CACHE_SIZE\s*=\s*(\d+)/);
  if (!match || parseInt(match[1]) !== 50) {
    throw new Error(`MAX_CACHE_SIZE is ${match ? match[1] : 'undefined'}, expected 50`);
  }
});

test('Service Worker has cache age limit', async () => {
  const swPath = path.join(__dirname, 'sw.js');
  const content = fs.readFileSync(swPath, 'utf8');

  if (!content.includes('MAX_CACHE_AGE')) {
    throw new Error('MAX_CACHE_AGE not defined');
  }

  // Check for formula or literal value (7 days = 604800000 ms)
  const has7Days = content.includes('7 * 24 * 60 * 60 * 1000') ||
                   content.includes('604800000');

  if (!has7Days) {
    throw new Error('MAX_CACHE_AGE not set to 7 days');
  }
});

test('Service Worker has navigation preload', async () => {
  const swPath = path.join(__dirname, 'sw.js');
  const content = fs.readFileSync(swPath, 'utf8');

  if (!content.includes('navigationPreload')) {
    throw new Error('Navigation preload not implemented');
  }

  if (!content.includes('preloadResponse')) {
    throw new Error('preloadResponse not used');
  }
});

test('Service Worker has metrics tracking', async () => {
  const swPath = path.join(__dirname, 'sw.js');
  const content = fs.readFileSync(swPath, 'utf8');

  if (!content.includes('cacheHits') || !content.includes('cacheMisses')) {
    throw new Error('Metrics tracking not found');
  }

  if (!content.includes('GET_METRICS')) {
    throw new Error('GET_METRICS message handler not found');
  }
});

test('Service Worker has cache trimming', async () => {
  const swPath = path.join(__dirname, 'sw.js');
  const content = fs.readFileSync(swPath, 'utf8');

  if (!content.includes('trimCache')) {
    throw new Error('trimCache function not found');
  }
});

test('Service Worker validates responses', async () => {
  const swPath = path.join(__dirname, 'sw.js');
  const content = fs.readFileSync(swPath, 'utf8');

  if (!content.includes('isValidResponse')) {
    throw new Error('isValidResponse function not found');
  }

  if (!content.includes('status === 200')) {
    throw new Error('Response validation not checking status 200');
  }
});

test('index.html loads successfully', async () => {
  const res = await fetch(BASE_URL + '/');
  if (res.status !== 200) {
    throw new Error(`HTTP ${res.status}`);
  }
  if (!res.body.includes('ProposalKit')) {
    throw new Error('Content missing');
  }
});

test('sw.js returns correct cache headers', async () => {
  const res = await fetch(BASE_URL + '/sw.js');
  if (res.status !== 200) {
    throw new Error(`HTTP ${res.status}`);
  }
});

test('vercel.json has immutable cache headers', async () => {
  const vercelPath = path.join(__dirname, 'vercel.json');
  if (!fs.existsSync(vercelPath)) {
    throw new Error('vercel.json not found');
  }

  const config = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
  const hasImmutable = config.headers?.some(h =>
    h.headers?.some(hh =>
      hh.value?.includes('immutable')
    )
  );

  if (!hasImmutable) {
    throw new Error('No immutable cache headers found');
  }
});

test('vercel.json has sw.js no-cache header', async () => {
  const vercelPath = path.join(__dirname, 'vercel.json');
  const config = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));

  const swHeader = config.headers?.find(h => h.source === '/sw.js');
  if (!swHeader) {
    throw new Error('sw.js cache header not found');
  }

  const cacheControl = swHeader.headers?.find(h => h.key === 'Cache-Control');
  if (!cacheControl || !cacheControl.value.includes('no-cache')) {
    throw new Error('sw.js not set to no-cache');
  }
});

test('index.html has preconnect hints', async () => {
  const indexPath = path.join(__dirname, 'index.html');
  const content = fs.readFileSync(indexPath, 'utf8');

  if (!content.includes('rel="preconnect"')) {
    throw new Error('No preconnect hints found');
  }

  const preconnectCount = (content.match(/rel="preconnect"/g) || []).length;
  if (preconnectCount < 3) {
    throw new Error(`Only ${preconnectCount} preconnect hints, expected at least 3`);
  }
});

test('boot.js has getCacheMetrics function', async () => {
  const bootPath = path.join(__dirname, 'assets/js/boot.js');
  const content = fs.readFileSync(bootPath, 'utf8');

  if (!content.includes('getCacheMetrics')) {
    throw new Error('getCacheMetrics function not found');
  }

  if (!content.includes('GET_METRICS')) {
    throw new Error('GET_METRICS message not sent');
  }
});

test('boot.js has clearAppCache function', async () => {
  const bootPath = path.join(__dirname, 'assets/js/boot.js');
  const content = fs.readFileSync(bootPath, 'utf8');

  if (!content.includes('clearAppCache')) {
    throw new Error('clearAppCache function not found');
  }
});

test('Static assets list is not empty', async () => {
  const swPath = path.join(__dirname, 'sw.js');
  const content = fs.readFileSync(swPath, 'utf8');

  const match = content.match(/STATIC_ASSETS\s*=\s*\[([\s\S]*?)\]/);
  if (!match) {
    throw new Error('STATIC_ASSETS not found');
  }

  const assets = match[1].split(',').filter(s => s.includes('/')).length;
  if (assets < 10) {
    throw new Error(`Only ${assets} assets, expected at least 10`);
  }
});

test('Service Worker has stale-while-revalidate', async () => {
  const swPath = path.join(__dirname, 'sw.js');
  const content = fs.readFileSync(swPath, 'utf8');

  if (!content.includes('staleWhileRevalidate')) {
    throw new Error('staleWhileRevalidate function not found');
  }
});

test('Service Worker has network-first with timeout', async () => {
  const swPath = path.join(__dirname, 'sw.js');
  const content = fs.readFileSync(swPath, 'utf8');

  if (!content.includes('networkFirstWithTimeout')) {
    throw new Error('networkFirstWithTimeout function not found');
  }

  if (!content.includes('Promise.race')) {
    throw new Error('Promise.race not used (needed for timeout)');
  }
});

test('Service Worker handles SPA routes', async () => {
  const swPath = path.join(__dirname, 'sw.js');
  const content = fs.readFileSync(swPath, 'utf8');

  if (!content.includes('isStandalonePage') && !content.includes('SPA route')) {
    throw new Error('SPA route handling not found');
  }
});

test('Service Worker cleans old caches', async () => {
  const swPath = path.join(__dirname, 'sw.js');
  const content = fs.readFileSync(swPath, 'utf8');

  if (!content.includes('filter(k => k !== CACHE_NAME)')) {
    throw new Error('Old cache cleanup not found');
  }
});

test('manifest.json exists', async () => {
  const manifestPath = path.join(__dirname, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('manifest.json not found');
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!manifest.name || !manifest.start_url) {
    throw new Error('manifest.json missing required fields');
  }
});

// ══════════════════════════════════════════
// RUN TESTS
// ══════════════════════════════════════════

runTests().catch(err => {
  log('\n❌ Test runner error: ' + err.message, 'red');
  process.exit(1);
});
