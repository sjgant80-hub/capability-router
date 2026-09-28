import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STAGES, REGISTRY, KEYWORDS, addressOf, stagesOf, route, decompose, allAddresses, coverage } from './router.mjs';

// ── the seven stages ──
test('STAGES is the seven capability stages in fixed order', () => {
  assert.deepEqual(STAGES, ['prove', 'own', 'shape', 'carry', 'remember', 'run', 'connect']);
  assert.equal(STAGES.length, 7);
});

// ── addressOf: need → 7-bit address ──
test('addressOf maps a need to its canonical bit address', () => {
  assert.equal(addressOf(['prove']).address, 1);          // bit 0
  assert.equal(addressOf(['own']).address, 2);            // bit 1
  assert.equal(addressOf(['connect']).address, 64);       // bit 6
  assert.equal(addressOf(['prove', 'own']).address, 3);   // bits 0+1
  assert.equal(addressOf(STAGES).address, 127);           // all seven
  assert.equal(addressOf(['prove']).ok, true);            // kills bits===0 → !==0 (would error on a valid need)
});
test('addressOf rejects empty, unknown, and non-array needs', () => {
  assert.equal(addressOf([]).ok, false);          // empty need is a gap
  assert.equal(addressOf(['nope']).ok, false);    // unknown stage
  assert.equal(addressOf('prove').ok, false);     // not an array
  assert.equal(addressOf(42).ok, false);
});

// ── stagesOf: address → stages, with boundaries ──
test('stagesOf inverts an address back to its stages', () => {
  assert.deepEqual(stagesOf(1).stages, ['prove']);        // kills (bit) !== 0 → === 0 (would invert the selection)
  assert.deepEqual(stagesOf(64).stages, ['connect']);
  assert.deepEqual(stagesOf(3).stages, ['prove', 'own']);
  assert.deepEqual(stagesOf(127).stages, STAGES);
});
test('stagesOf enforces the 1..127 range at the exact boundaries', () => {
  assert.equal(stagesOf(1).ok, true);     // min valid — kills address < 1 → <= 1
  assert.equal(stagesOf(127).ok, true);   // max valid — kills address > 127 → >= 127
  assert.equal(stagesOf(0).ok, false);    // below range
  assert.equal(stagesOf(128).ok, false);  // above range
  assert.equal(stagesOf(200).ok, false);  // with 0, kills the || → && (both must be rejected)
  assert.equal(stagesOf(1.5).ok, false);  // non-integer
  assert.equal(stagesOf('7').ok, false);  // non-number
});
test('address round-trips: stagesOf then addressOf is identity for every address', () => {
  for (const a of [1, 2, 5, 42, 64, 100, 127]) assert.equal(addressOf(stagesOf(a).stages).address, a);
});

// ── route: need → organ-set ──
test('route returns the exact, sorted, de-duplicated organ-set for a need', () => {
  const r = route(['prove']);
  assert.equal(r.ok, true);
  assert.equal(r.address, 1);
  assert.deepEqual(r.organs, [...REGISTRY.prove].sort());
  const both = route(['prove', 'own']);
  assert.equal(both.organs.length, REGISTRY.prove.length + REGISTRY.own.length); // disjoint, no dupes lost
  assert.ok(both.organs.includes('witness') && both.organs.includes('the-wallet'));
  assert.deepEqual(both.organs, [...both.organs].sort());  // sorted → deterministic
});
test('route rejects a bad need the same way addressOf does', () => {
  assert.equal(route([]).ok, false);
  assert.equal(route(['nope']).ok, false);
});

// ── decompose: text → stages ──
test('decompose reads the needed stages out of plain text', () => {
  assert.deepEqual(decompose('please prove this and store the result').stages, ['prove', 'remember']);
  assert.deepEqual(decompose('build it then run it').stages, ['shape', 'run']);
  assert.deepEqual(decompose('pay and connect').stages, ['own', 'connect']);
  assert.equal(decompose('verify a receipt').ok, true);   // kills stages.length===0 → !==0
});
test('decompose rejects text with no capability word, and non-strings', () => {
  assert.equal(decompose('zzz qqq nothing here').ok, false);
  assert.equal(decompose('').ok, false);
  assert.equal(decompose(42).ok, false);   // kills the || [] → && [] fallback (would empty every match)
});

// ── the 127 addresses ──
test('allAddresses is exactly the 127 non-empty addresses', () => {
  const all = allAddresses();
  assert.equal(all.length, 127);          // kills a <= 127 → a < 127 (would be 126)
  assert.equal(all[0], 1);
  assert.equal(all[all.length - 1], 127);
});

// ── THE COVERAGE GATE ──
test('coverage passes on the real estate registry (no gaps)', () => {
  const c = coverage();
  assert.equal(c.ok, true);               // kills each length===0 → !==0 in the verdict
  assert.equal(c.stages, 7);
  assert.equal(c.addresses, 127);
  assert.deepEqual(c.unservedStages, []);
  assert.deepEqual(c.unkeyedStages, []);
  assert.equal(c.emptyRoutes, 0);
  assert.ok(c.organs >= 20);
});
test('coverage FAILS when a stage has no organs, and counts exactly the gap', () => {
  const c = coverage({ ...REGISTRY, prove: [] });
  assert.equal(c.ok, false);
  assert.deepEqual(c.unservedStages, ['prove']);   // kills the || → && in the unserved filter (would miss it)
  assert.equal(c.emptyRoutes, 1);                  // only address {prove} goes empty — kills emptyRoutes miscount
});
test('coverage FAILS when a stage is missing entirely from the registry', () => {
  const c = coverage({ ...REGISTRY, run: undefined });
  assert.equal(c.ok, false);
  assert.ok(c.unservedStages.includes('run'));     // kills || → && (mutant would throw on undefined.length)
});
test('coverage FAILS on an unkeyed stage even when every stage is served', () => {
  // registry intact (unserved=[], emptyRoutes=0) but a stage has no keyword: only the middle condition is false.
  const c = coverage(REGISTRY, { ...KEYWORDS, run: [] });
  assert.equal(c.ok, false);                       // kills both && → || (A true, B false, C true must stay false)
  assert.deepEqual(c.unkeyedStages, ['run']);
  assert.deepEqual(c.unservedStages, []);
  assert.equal(c.emptyRoutes, 0);
});
test('coverage FAILS when a stage is missing from the keyword map entirely', () => {
  const c = coverage(REGISTRY, { ...KEYWORDS, connect: undefined });
  assert.equal(c.ok, false);
  assert.ok(c.unkeyedStages.includes('connect'));  // kills || → && in the unkeyed filter
});
