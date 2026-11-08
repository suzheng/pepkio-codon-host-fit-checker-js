# Pepkio Codon Host Fit Checker

TypeScript and JavaScript client library with CLI for programmatic codon adaptation analysis, multi-host expression compatibility screening, and rare codon bottleneck detection via the Pepkio Tools API.

# What It Does

In recombinant protein production and synthetic biology, achieving high expression yields requires aligning target sequence codons with the host organism's translational machinery. Mismatched codon usage can lead to ribosome stalling, translation termination, amino acid misincorporation, and reduced yields across common hosts such as *E. coli*, *S. cerevisiae*, *P. pastoris*, CHO, HEK293, *Sf9*, and *B. subtilis*.

This package provides a typed Node.js client and command-line interface for the hosted Pepkio Codon Host Fit Checker REST API. It evaluates global Codon Adaptation Index (CAI) scores, positional GC distributions ($GC_1, GC_2, GC_3$), and rare codon clusters without requiring local computational biology engines or reference usage tables.

Programmatic runs require a network connection and a Pepkio API key. Calculations are processed via the Pepkio Tools API.

# Features

- **Multi-Host Compatibility Profiling**: Evaluates nucleotide sequences across built-in codon usage tables for *E. coli* (K-12 & BL21(DE3)), *S. cerevisiae*, *P. pastoris*, CHO, HEK293, *Sf9*, and *B. subtilis*.
- **Codon Adaptation Index (CAI)**: Calculates geometric mean CAI scores relative to host-specific reference sets.
- **Rare Codon & Bottleneck Mapping**: Flags rare codons and tandem clusters ($w_i < 0.15$) that risk translational pausing or stalling.
- **Positional GC & Regional Composition**: Computes overall GC and position-specific ($GC_1, GC_2, GC_3$) metrics along with sliding-window profiles.
- **Translational Signal Detection**: Screens for internal Shine-Dalgarno motifs, eukaryotic cryptic splice sites, and premature stop codons.
- **High-Level Helper Methods**: Dedicated methods for common workflows: `checkMatrix()`, `checkSingleHost()`, `checkHostRanker()`, and `checkBatch()`.
- **Typed ESM Client**: Full TypeScript type declarations with Zod schema validation, Promise-based API (`getManifest`, `getExampleInput`, `run`, `waitForRun`).
- **Command-Line Interface (CLI)**: Inspect manifests and execute evaluations directly from the shell (`pepkio-codon-host-fit-checker manifest`, `run`).

# Installation

```bash
npm install pepkio-codon-host-fit-checker
```

Requires Node.js 18 or newer.

# Configuration

Set an API key with **tools:run** scope before calling `run()`:

```bash
export PEPKIO_API_KEY="your-api-key"
```

Create a key at [Pepkio API keys](https://www.pepkio.com/account/api-keys).

Optional configuration variables:

| Variable | Purpose |
|----------|---------|
| `PEPKIO_API_KEY` | Production API key (required for `run`) |
| `LOCAL_PEPKIO_API_KEY` | Local development key when `PEPKIO_API_BASE_URL` points to `tools.localtest.me` |
| `PEPKIO_API_BASE_URL` | API base URL (default: `https://tools.pepkio.com`) |

# Quick Example

```typescript
import { PepkioClient } from "pepkio-codon-host-fit-checker";

const client = new PepkioClient({ apiKey: process.env.PEPKIO_API_KEY });

// Multi-host codon compatibility check for a sequence
const result = await client.checkMatrix(
  "ATGGTGAGCAAGGGCGAGGAGCTGTTCACCGGGGTGGTGCCCATCCTGGTCGAGCTGGACGGCGACGTAAACGGCCACAAG",
  ["e_coli_k12", "cho", "human_hek293"]
);

console.log("Run ID:", result.run_id);
console.log("Status:", result.status);

const seq = result.result?.sequences?.[0];
if (seq) {
  console.log("Best host:", seq.best_host_id);
  for (const m of seq.host_metrics) {
    console.log(`  ${m.host_name}: CAI = ${m.cai}, GC = ${m.gc_percent}%`);
  }
}
```

# CLI

```bash
# List available manifest examples
npx pepkio-codon-host-fit-checker manifest --examples

# Run a matrix example
npx pepkio-codon-host-fit-checker run --example gfp_matrix

# Inspect a single host example
npx pepkio-codon-host-fit-checker run --example short_inspector
```

# Typical Use Cases

- **Expression Host Organism Selection**: Compare codon adaptation metrics across bacterial (*E. coli*), yeast (*P. pastoris*), and mammalian (CHO) systems prior to cloning.
- **Gene Synthesis Pre-Flight Auditing**: Verify that codon-optimized sequences avoid rare codon bottlenecks and unintended secondary structures before synthesis orders.
- **Troubleshooting Expression Yield Drops**: Identify host-specific rare codon clusters causing translational stalling or truncated recombinant products.
- **Dual-Host Shuttle Vector Optimization**: Audit constructs designed for propagation in *E. coli* and subsequent expression in eukaryotic cells.
- **Multi-Gene Operon Balancing**: Profile translational efficiencies across synthetic metabolic pathways to prevent cellular resource drain.

# Scientific Background

Heterologous protein expression efficiency depends heavily on concordance between candidate coding sequences and host tRNA pools. The Codon Adaptation Index (CAI) quantifies this bias by calculating the geometric mean of relative adaptiveness values ($w_i$) against highly expressed reference genes. A high global CAI score can still obscure localized rare codon clusters ($w_i < 0.15$), which cause ribosomal pausing, co-translational misfolding, or truncated peptides. Evaluating positional GC content ($GC_1, GC_2, GC_3$) and identifying undesirable sequence signals (e.g. internal Shine-Dalgarno motifs or cryptic splice sites) further ensures robust mRNA stability and efficient translation.

# Web Application

For researchers who prefer a graphical interface, an interactive web version is available.

Web Application: https://www.pepkio.com/tools/codon-host-fit-checker

The web application provides visual codon usage heatmaps, side-by-side host comparison matrices, downloadable worksheets, and shareable permalinks. The npm package uses the same calculation engine via the REST API.

# Documentation and Resources

GitHub Repository: https://github.com/pepkio/pepkio-codon-host-fit-checker-js

Web Application: https://www.pepkio.com/tools/codon-host-fit-checker

Python client (PyPI): https://pypi.org/project/pepkio-codon-host-fit-checker/

# About Pepkio

Pepkio (https://www.pepkio.com/) develops software tools and bioinformatics solutions for life science researchers, including laboratory calculators and analysis services (https://www.pepkio.com/cro).

A semantic, AI-native version of this document in the K2F format is available at https://k2f.dev (https://k2f.dev/v/3c20de78952758e027bcc7bc1b8f78031b415eee534e4ef2905a3f720cdc9629)
