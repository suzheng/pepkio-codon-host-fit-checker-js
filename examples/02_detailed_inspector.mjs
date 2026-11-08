// SPDX-License-Identifier: MIT
import { PepkioClient } from "pepkio-codon-host-fit-checker";

const client = new PepkioClient();

async function main() {
  // Inspect single-host details (codon heatmap, rare codons, flags)
  const result = await client.inspectHost(
    "ATGAAACGCATTAGCACCACCATTACCACCATTACCACAGGTAACGGTGCGGGCTGACGGGCGTTAAGCTCACTCGGCTGGCTCCAGTGGGATAAGTCGCCTATTGGCGCTCTGCCCGCGTTCCAGTCAGGAAACGCTGGTAA",
    "e_coli_bl21",
    { checkCisElements: true, checkRestrictionSites: true },
  );

  console.log(`Run ID: ${result.run_id}`);
  const seq = result.result?.sequences?.[0];
  const inspector = seq?.inspector;
  if (inspector) {
    console.log(`Host: ${inspector.host_name}`);
    console.log(`Rare codons: ${inspector.rare_codon_count}`);
    console.log(`Flags summary: ${inspector.flags_summary}`);
    console.log(`Total codons annotated: ${inspector.codons.length}`);
  }
}

main().catch(console.error);
