// SPDX-License-Identifier: MIT
import { z } from "zod";

export const workspaceTabSchema = z.enum(["matrix", "inspector", "batch", "codon_tables"]);

export const codonHostFitCheckerInputSchema = z
  .object({
    tab: workspaceTabSchema.default("matrix"),
    sequence: z.string().optional(),
    fasta_text: z.string().optional(),
    host_ids: z.array(z.string()).optional(),
    custom_codon_table: z.string().optional(),
    custom_host_name: z.string().optional(),
    rare_codon_threshold: z.number().min(0).max(1).optional(),
    gc_window_bp: z.number().int().positive().optional(),
    check_cis_elements: z.boolean().optional(),
    check_restriction_sites: z.boolean().optional(),
    restriction_enzymes: z.array(z.string()).optional(),
    inspector_host_id: z.string().optional(),
  })
  .passthrough();

export type WorkspaceTabInput = z.infer<typeof workspaceTabSchema>;
export type CodonHostFitCheckerInput = z.input<typeof codonHostFitCheckerInputSchema>;
export type CodonHostFitCheckerResolvedInput = z.infer<typeof codonHostFitCheckerInputSchema>;

export function parseRunInput(input: unknown): CodonHostFitCheckerResolvedInput {
  return codonHostFitCheckerInputSchema.parse(input);
}
