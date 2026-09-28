// router.mjs — a deterministic capability router over the estate's real organs (witness-gated).
//
// A task can need seven capability STAGES: Prove, Own, Shape, Carry, Remember, Run, Connect. A task's
// need is any non-empty combination of them — there are exactly 127 such combinations, each one
// a stable ADDRESS. route() maps a need to the exact set of organs that serve those stages, and
// coverage() is the GATE: it proves every stage is served, every stage is reachable from plain words,
// and all 127 addresses route to a real, non-empty organ-set — so nothing a task needs falls through a
// silent gap. Pure, total, deterministic. Garbage in returns { ok:false, error }, never a throw.
//
// The seven-stage / 127-address capability basis is Thomas Frumkin's MACCubeFACE lattice (see NOTICE);
// this router over the estate's own organs is the estate's build.

export const STAGES = ['prove', 'own', 'shape', 'carry', 'remember', 'run', 'connect'];

// each stage maps to the real estate organs that serve it (public organ names)
export const REGISTRY = {
  prove:    ['witness', 'acg-assessor', 'kar-warden', 'dual-map-gate'],
  own:      ['the-wallet', 'konomium-vault', 'kcc-mint', 'fallaccount-engine'],
  shape:    ['fallforge', 'fallkit', 'forge-studio', 'the-assembly'],
  carry:    ['fall-federate', 'meshos', 'mesh-and-pub'],
  remember: ['fall-remember', 'nested-solid', 'durable-memory'],
  run:      ['si-didy-run', 'fallbrain', 'liveware-core'],
  connect:  ['sovereign-browser', 'kar-wisp', 'signals-feed'],
};

// plain words that name each stage, so a task described in words can be decomposed to its need
export const KEYWORDS = {
  prove:    ['prove', 'verify', 'gate', 'audit', 'witness', 'check', 'attest', 'proof'],
  own:      ['own', 'pay', 'wallet', 'ledger', 'account', 'budget', 'mint', 'custody'],
  shape:    ['build', 'make', 'shape', 'forge', 'author', 'compose', 'generate', 'assemble'],
  carry:    ['carry', 'send', 'federate', 'sync', 'transport', 'relay', 'peer', 'mesh'],
  remember: ['remember', 'store', 'recall', 'memory', 'persist', 'log', 'archive'],
  run:      ['run', 'execute', 'serve', 'host', 'boot', 'operate', 'loop'],
  connect:  ['connect', 'browse', 'link', 'reach', 'signal', 'publish', 'notify'],
};

const STAGE_INDEX = new Map(STAGES.map((s, i) => [s, i]));
function isStage(s) { return STAGE_INDEX.has(s); }

// a need (array of stage names) becomes a canonical 7-bit address (1..127)
export function addressOf(stages) {
  if (!Array.isArray(stages)) return { ok: false, error: 'need must be an array of stage names' };
  let bits = 0;
  for (const s of stages) {
    if (!isStage(s)) return { ok: false, error: 'unknown stage: ' + String(s) };
    bits |= (1 << STAGE_INDEX.get(s));
  }
  if (bits === 0) return { ok: false, error: 'empty need: a task must require at least one stage' };
  return { ok: true, address: bits };
}

// an address (1..127) becomes its sorted stage names
export function stagesOf(address) {
  if (typeof address !== 'number' || !Number.isInteger(address)) return { ok: false, error: 'address must be an integer' };
  if (address < 1 || address > 127) return { ok: false, error: 'address out of range (1..127)' };
  const stages = STAGES.filter((_, i) => (address & (1 << i)) !== 0);
  return { ok: true, stages };
}

// the organ union for a set of stages under a given registry (internal, so route + coverage share one path)
function organsFor(reg, stages) {
  const set = new Set();
  for (const stage of stages) for (const organ of (reg[stage] || [])) set.add(organ);
  return [...set].sort();
}

// route a need to the exact organ-set
export function route(need) {
  const a = addressOf(need);
  if (!a.ok) return a;
  const stages = stagesOf(a.address).stages;
  return { ok: true, address: a.address, stages, organs: organsFor(REGISTRY, stages) };
}

// read the stages a task asks for out of plain text (deterministic keyword match)
export function decompose(text) {
  if (typeof text !== 'string') return { ok: false, error: 'text must be a string' };
  const words = text.toLowerCase().match(/[a-z]+/g) || [];
  const found = new Set();
  for (const [stage, keys] of Object.entries(KEYWORDS)) {
    for (const w of words) if (keys.includes(w)) { found.add(stage); break; }
  }
  const stages = STAGES.filter((s) => found.has(s));
  if (stages.length === 0) return { ok: false, error: 'no capability keyword recognised in text' };
  return { ok: true, stages };
}

// every non-empty address over 7 stages — exactly 127 of them
export function allAddresses() {
  const out = [];
  for (let a = 1; a <= 127; a++) out.push(a);
  return out;
}

// THE COVERAGE GATE. Proves, over a registry + keyword map (the estate's own by default):
//   - every stage is served by at least one organ (no unreachable capability),
//   - every stage is named by at least one keyword (decompose can reach it),
//   - all 127 addresses route to a non-empty organ-set (no silent gap).
// Parametrised so the gate itself can be tested against a deliberately broken map.
export function coverage(reg = REGISTRY, keys = KEYWORDS) {
  const unservedStages = STAGES.filter((s) => !Array.isArray(reg[s]) || reg[s].length === 0);
  const unkeyedStages  = STAGES.filter((s) => !Array.isArray(keys[s]) || keys[s].length === 0);
  let emptyRoutes = 0;
  for (const a of allAddresses()) {
    if (organsFor(reg, stagesOf(a).stages).length === 0) emptyRoutes += 1;
  }
  const ok = unservedStages.length === 0 && unkeyedStages.length === 0 && emptyRoutes === 0;
  return { ok, stages: STAGES.length, addresses: 127, organs: organsFor(reg, STAGES).length,
           unservedStages, unkeyedStages, emptyRoutes };
}

export default { STAGES, REGISTRY, KEYWORDS, addressOf, stagesOf, route, decompose, allAddresses, coverage };
