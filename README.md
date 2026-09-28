# Capability Router

**▶ Live: https://sjgant80-hub.github.io/capability-router/**

<!-- film-2026-09 -->
**▶ [Watch the 90-second film](https://www.ai-nativesolutions.com/explainer.html#film)** — the router and its dispatcher, inside the whole estate · [The brochure (PDF)](https://www.ai-nativesolutions.com/fall-os-prospectus.pdf) · [Every number, sourced](https://www.ai-nativesolutions.com/explainer.html#facts)

[![The dispatcher's three honest states: 7 run themselves, 9 wait for a human key, 8 to-do](https://www.ai-nativesolutions.com/media/images/dispatcher-three-states.jpg)](https://www.ai-nativesolutions.com/explainer.html#film)

A sovereign, deterministic **router over the estate's real organs**. Seven capability
stages — **Prove · Own · Shape · Carry · Remember · Run · Connect** — and a task needs
some non-empty combination of them. There are exactly **127** such combinations, each a
stable address. The router maps a need to the precise set of estate organs that serve it,
and a **coverage gate** proves no task falls through a silent gap. It runs entirely in your
tab, zero dependencies, kernel-backed by the mutation-gated `router.mjs`.

## What it does

- **`route(need)`** — a need (stage names, or read from plain text by `decompose`) becomes
  the exact, sorted, de-duplicated organ-set that serves it, plus its address.
- **`addressOf` / `stagesOf`** — a need is a 7-bit address (1..127) and back again, losslessly.
- **`decompose(text)`** — reads the capabilities a task asks for out of plain words.
- **`coverage()`** — THE GATE. Proves, over the registry, that every stage is served by at
  least one organ, every stage is named by at least one keyword, and all 127 addresses route
  to a non-empty organ-set. No unreachable capability, no silent gap.
- Total and pure: bad input returns `{ ok: false, error }` — it never throws.

## Proof (no test-theatre)

- `router.test.mjs` — 16 tests covering every function, the address boundaries, and the
  coverage gate tested against deliberately broken registries.
- **witness mutation gate — CLEAN, score 1.0 (22/22 mutants killed, 0 survivors).** Every
  operator in the kernel is flipped and a test catches it. Runs in CI on every push
  (`.github/workflows/gate.yml`); a green run on GitHub's own runner is the proof.

```
node --test router.test.mjs
node .witness/witness.mjs mutate router.mjs --cap 500 --test node --test router.test.mjs
```

## Provenance

The seven-stage / 127-address capability basis — the seven-ring structure that gives every
non-empty combination of capabilities a stable address — is **Thomas Frumkin's MACCubeFACE
lattice** ([teslasolar/MianoCube](https://github.com/teslasolar/MianoCube)). The
deterministic router over the estate's own organs, the coverage gate, and this page are the
estate's build on top of it. Powered by the Konomi architecture, created by Thomas Frumkin.
See [NOTICE](NOTICE).

## License

MIT — the estate's own code only (see [LICENSE](LICENSE)). The capability basis is Thomas
Frumkin's; credit is recorded in [NOTICE](NOTICE).
