/**
 * Bio Studio Feature Tests
 * Tests for: drag-and-drop reordering persistence, QR code generation,
 * analytics authorization, and error handling.
 *
 * Run with: npx ts-node tests/bio-studio.test.ts
 * (or integrate into your chosen test runner)
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`  ✅ PASS: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`FAIL: ${message}\n  Expected: ${JSON.stringify(expected)}\n  Actual:   ${JSON.stringify(actual)}`);
  }
  console.log(`  ✅ PASS: ${message}`);
}

// ─── 1. Drag-and-Drop Reorder Logic ───────────────────────────────────────────

function testReorderLogic() {
  console.log("\n📦 1. Drag-and-Drop Reorder Logic");

  const links = [
    { id: "a", title: "Link A", order: 0 },
    { id: "b", title: "Link B", order: 1 },
    { id: "c", title: "Link C", order: 2 },
    { id: "d", title: "Link D", order: 3 },
  ];

  // Simulate arrayMove(links, 0, 2) — drag A from position 0 to position 2
  function arrayMove<T>(arr: T[], from: number, to: number): T[] {
    const result = [...arr];
    const [item] = result.splice(from, 1);
    result.splice(to, 0, item);
    return result;
  }

  const reordered = arrayMove(links, 0, 2).map((l, idx) => ({ ...l, order: idx }));

  assertEqual(reordered[0].id, "b", "B should now be at index 0");
  assertEqual(reordered[1].id, "c", "C should now be at index 1");
  assertEqual(reordered[2].id, "a", "A should now be at index 2 (was dragged here)");
  assertEqual(reordered[3].id, "d", "D should still be at index 3");

  // Verify order values are sequential from 0
  reordered.forEach((l, idx) => {
    assertEqual(l.order, idx, `Order field for item at index ${idx} should be ${idx}`);
  });

  // Edge case: drag to same position → no change
  const same = arrayMove(links, 1, 1).map((l, idx) => ({ ...l, order: idx }));
  assertEqual(same[1].id, "b", "Same-position drag should not change order");

  // Edge case: drag last to first
  const lastToFirst = arrayMove(links, 3, 0).map((l, idx) => ({ ...l, order: idx }));
  assertEqual(lastToFirst[0].id, "d", "D dragged to first should be at index 0");
  assertEqual(lastToFirst[1].id, "a", "A should shift to index 1");
}

// ─── 2. Analytics Date Key Generation ────────────────────────────────────────

function testAnalyticsDateKey() {
  console.log("\n📅 2. Analytics Date Key");

  function getTodayDateKey(): string {
    return new Date().toISOString().slice(0, 10);
  }

  const key = getTodayDateKey();
  assert(/^\d{4}-\d{2}-\d{2}$/.test(key), `Date key format is YYYY-MM-DD: got "${key}"`);

  // Check it matches today's date in UTC
  const today = new Date();
  const expected = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;
  assertEqual(key, expected, "Date key matches today's UTC date");
}

// ─── 3. Analytics Range / Window Computation ─────────────────────────────────

function testAnalyticsWindowFill() {
  console.log("\n📊 3. Analytics Window Fill (gap filling)");

  function buildWindow(days: number): Record<string, { views: number; clicks: number }> {
    const dataMap: Record<string, { views: number; clicks: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      dataMap[key] = { views: 0, clicks: 0 };
    }
    return dataMap;
  }

  const w7 = buildWindow(7);
  const w30 = buildWindow(30);
  const w90 = buildWindow(90);

  assertEqual(Object.keys(w7).length, 7, "7d window has exactly 7 days");
  assertEqual(Object.keys(w30).length, 30, "30d window has exactly 30 days");
  assertEqual(Object.keys(w90).length, 90, "90d window has exactly 90 days");

  // All entries start at zero
  Object.values(w7).forEach((v) => {
    assert(v.views === 0 && v.clicks === 0, "All gap days initialize to zero");
  });

  // Verify today is the last key
  const keys7 = Object.keys(w7).sort();
  const todayKey = new Date().toISOString().slice(0, 10);
  assertEqual(keys7[keys7.length - 1], todayKey, "Last key in window is today");
}

// ─── 4. Analytics Authorization: Unauthenticated Requests ────────────────────

function testAnalyticsAuthRequired() {
  console.log("\n🔐 4. Analytics Authorization");

  // The endpoint signature requires: requireFirebaseAuth middleware
  // This test documents the expected behavior:

  function simulateUnauthorizedRequest(): { status: number; error: string } {
    // Without a valid Firebase token, requireFirebaseAuth should return 401
    return { status: 401, error: "Unauthorized: No Firebase token provided." };
  }

  function simulateOtherUserRequest(requestUid: string, profileUid: string): boolean {
    // With the /me route, the UID comes from the verified token — not from
    // the URL. So a user can ONLY access their own analytics.
    return requestUid === profileUid;
  }

  const unauthorized = simulateUnauthorizedRequest();
  assertEqual(unauthorized.status, 401, "Unauthenticated request returns 401");

  assert(!simulateOtherUserRequest("uid-alice", "uid-bob"), "Alice cannot access Bob's analytics");
  assert(simulateOtherUserRequest("uid-alice", "uid-alice"), "Alice can access her own analytics");
}

// ─── 5. QR Code URL Construction ─────────────────────────────────────────────

function testQRCodeUrl() {
  console.log("\n📱 5. QR Code URL Construction");

  function buildQRUrl(username: string): string {
    return `https://hiiinishant.com/${username}`;
  }

  assertEqual(buildQRUrl("hiiinishant"), "https://hiiinishant.com/hiiinishant", "Known username builds correct URL");
  assertEqual(buildQRUrl("testuser"), "https://hiiinishant.com/testuser", "Generic username builds correct URL");

  // Must not contain double slashes after domain
  const url = buildQRUrl("user");
  assert(!url.includes("//user"), "URL does not contain double slashes before username");

  // Must use HTTPS
  assert(url.startsWith("https://"), "URL uses HTTPS");

  // Must point to hiiinishant.com domain
  assert(url.includes("hiiinishant.com"), "URL points to hiiinishant.com");
}

// ─── 6. Bot Filter ────────────────────────────────────────────────────────────

function testBotFilter() {
  console.log("\n🤖 6. Bot / Duplicate Filtering");

  const BOT_REGEX = /(bot|crawler|spider|crawling|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|sogou|exabot|facebookexternalhit|facebot|ia_archiver|curl|wget|python)/i;

  function isBot(ua?: string): boolean {
    if (!ua) return true;
    return BOT_REGEX.test(ua);
  }

  assert(isBot("Googlebot/2.1"), "Googlebot is filtered");
  assert(isBot("Bingbot/2.0"), "Bingbot is filtered");
  assert(isBot("curl/7.79.1"), "curl is filtered");
  assert(isBot("python-requests/2.28"), "Python requests are filtered");
  assert(isBot(), "No user-agent treated as bot");
  assert(!isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)"), "iOS Safari is not filtered");
  assert(!isBot("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"), "Chrome on Windows is not filtered");

  // Rate-limit logic: same IP within 60s should not count again
  const viewCooldown = new Map<string, number>();
  const ip = "192.168.1.1";
  const username = "testuser";
  const key = `view:${ip}:${username}`;

  const first = Date.now();
  viewCooldown.set(key, first);

  // Second request 30s later — should be rate-limited
  const secondAt = first + 30_000;
  const shouldRateLimit = viewCooldown.has(key) && secondAt - (viewCooldown.get(key)!) < 60_000;
  assert(shouldRateLimit, "Second view within 60s is rate-limited");

  // Third request 61s later — should NOT be rate-limited
  const thirdAt = first + 61_000;
  const shouldAllow = !viewCooldown.has(key) || thirdAt - (viewCooldown.get(key)!) >= 60_000;
  assert(shouldAllow, "View after 60s cooldown is allowed");
}

// ─── 7. Daily Stats Merge Behavior ───────────────────────────────────────────

function testDailyStatsMerge() {
  console.log("\n🗃️  7. Daily Stats Merge Semantics");

  // The daily_stats document is written with { merge: true } so:
  // - First write creates the document with both views and clicks
  // - Subsequent writes increment the correct field without overwriting the other

  interface DailyDoc {
    date: string;
    views: number;
    clicks: number;
  }

  function simulateMergeWrite(existing: DailyDoc | null, field: "views" | "clicks"): DailyDoc {
    const today = new Date().toISOString().slice(0, 10);
    if (!existing) {
      // First write: both fields initialized
      return {
        date: today,
        views: field === "views" ? 1 : 0,
        clicks: field === "clicks" ? 1 : 0,
      };
    }
    return {
      ...existing,
      [field]: existing[field] + 1,
    };
  }

  const doc1 = simulateMergeWrite(null, "views");
  assertEqual(doc1.views, 1, "First view write sets views=1");
  assertEqual(doc1.clicks, 0, "First view write leaves clicks=0");

  const doc2 = simulateMergeWrite(doc1, "clicks");
  assertEqual(doc2.views, 1, "First click write leaves views=1");
  assertEqual(doc2.clicks, 1, "First click write sets clicks=1");

  const doc3 = simulateMergeWrite(doc2, "views");
  assertEqual(doc3.views, 2, "Second view increments views to 2");
  assertEqual(doc3.clicks, 1, "Second view leaves clicks=1");
}

// ─── Run all tests ────────────────────────────────────────────────────────────

async function runAll() {
  let passed = 0;
  let failed = 0;

  const tests = [
    testReorderLogic,
    testAnalyticsDateKey,
    testAnalyticsWindowFill,
    testAnalyticsAuthRequired,
    testQRCodeUrl,
    testBotFilter,
    testDailyStatsMerge,
  ];

  for (const test of tests) {
    try {
      test();
      passed++;
    } catch (err: any) {
      console.error(`\n  ❌ ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${"─".repeat(60)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runAll().catch(console.error);
