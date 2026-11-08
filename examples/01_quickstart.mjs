// SPDX-License-Identifier: MIT
import { PepkioClient } from "pepkio-codon-host-fit-checker";

const client = new PepkioClient();

async function main() {
  const manifest = await client.getManifest();
  console.log(`Tool: ${manifest.title} (${manifest.tool_id})`);

  // Compare multi-host codon fit for a GFP coding fragment
  const result = await client.checkMatrix(
    "ATGGTGAGCAAGGGCGAGGAGCTGTTCACCGGGGTGGTGCCCATCCTGGTCGAGCTGGACGGCGACGTAAACGGCCACAAGTTCAGCGTGTCCGGCGAGGGCGAGGGCGATGCCACCTACGGCAAGCTGACCCTGAAGTTCATCTGCACCACCGGCAAGCTGCCCGTGCCCTGGCCCACCCTCGTGACCACCCTGACCTACGGCGTGCAGTGCTTCAGCCGCTACCCCGACCACATGAAGCAGCACGACTTCTTCAAGTCCGCCATGCCCGAAGGCTACGTCCAGGAGCGCACCATCTTCTTCAAGGACGACGGCAACTACAAGACCCGCGCCGAGGTGAAGTTCGAGGGCGACACCCTGGTGAACCGCATCGAGCTGAAGGGCATCGACTTCAAGGAGGACGGCAACATCCTGGGGCACAAGCTGGAGTACAACTACAACAGCCACAACGTCTATATCATGGCCGACAAGCAGAAGAACGGCATCAAGGTGAACTTCAAGATCCGCCACAACATCGAGGACGGCAGCGTGCAGCTCGCCGACCACTACCAGCAGAACACCCCCATCGGCGACGGCCCCGTGCTGCTGCCCGACAACCACTACCTGAGCACCCAGTCCGCCCTGAGCAAAGACCCCAACGAGAAGCGCGATCACATGGTCCTGCTGGAGTTCGTGACCGCCGCCGGGATCACTCTCGGCATGGACGAGCTGTACAAGTAA",
    ["e_coli_k12", "cho", "human_hek293"],
  );

  console.log(`Run ID: ${result.run_id}`);
  console.log(`Status: ${result.status}`);

  const seq = result.result?.sequences?.[0];
  if (seq) {
    console.log(`Best host: ${seq.best_host_id}`);
    for (const m of seq.host_metrics) {
      console.log(`  ${m.host_name} (${m.host_id}): CAI=${m.cai}, GC=${m.gc_percent}%, Composite Score=${m.composite_score}`);
    }
  }
}

main().catch(console.error);
