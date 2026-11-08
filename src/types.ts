// SPDX-License-Identifier: MIT

export type RunStatus = "queued" | "running" | "completed" | "failed" | (string & {});

export interface RunOptions {
  idempotency_key?: string;
  label?: string;
  [key: string]: unknown;
}

export interface RunResult<T = CodonHostFitResult> {
  run_id: string;
  status: RunStatus;
  result?: T;
  error?: string | { message?: string; code?: string; details?: unknown } | null;
  result_url?: string;
  permalink?: string;
  duration_ms?: number;
}

export interface ManifestExample {
  name: string;
  description?: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface ToolManifest {
  schema_version: string;
  tool_id: string;
  title: string;
  description?: string;
  tags?: string[];
  category?: string;
  execution_mode?: string;
  estimated_runtime_sec?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  agent_notes?: string;
  example_prompts?: string[];
  examples?: ManifestExample[];
  limits?: Record<string, unknown>;
  input_schema?: Record<string, unknown>;
}

export interface ExampleMeta {
  name: string;
  description?: string;
}

export type WorkspaceTab = "matrix" | "inspector" | "batch" | "codon_tables";

export type HostId =
  | "e_coli_k12"
  | "e_coli_bl21"
  | "s_cerevisiae"
  | "cho"
  | "human_hek293"
  | "human"
  | "p_pastoris"
  | "insect_sf9"
  | (string & {});

export interface CodonAnnotation {
  index: number;
  codon: string;
  amino_acid: string;
  frequency: number;
  adaptiveness: number;
  is_rare: boolean;
  is_tandem_bottleneck: boolean;
}

export interface GcWindowPoint {
  position: number;
  gc_percent: number;
}

export interface SequenceFlag {
  type: string;
  label: string;
  start_nt: number;
  end_nt: number;
  detail?: string;
  suggestion?: string;
}

export interface SynonymousOption {
  codon: string;
  frequency: number;
  adaptiveness: number;
}

export interface HostMetrics {
  host_id: string;
  host_name: string;
  composite_score: number;
  cai: number;
  gc_percent: number;
  gc_status: "good" | "low" | "high" | (string & {});
  initiation_delta_g: number;
  initiation_risk: "low" | "moderate" | "high" | (string & {});
  codon_pair_score: number | null;
  rare_codon_count: number;
  tandem_bottleneck_count: number;
  flag_count: number;
  flags_summary: string;
}

export interface HostDetail extends HostMetrics {
  codons: CodonAnnotation[];
  gc_profile: GcWindowPoint[];
  initiation_region: string;
  initiation_leader_used: boolean;
  flags: SequenceFlag[];
  synonymous_suggestions: Record<string | number, SynonymousOption[]>;
}

export interface SequenceAnalysis {
  id: string;
  name: string;
  sequence: string;
  length_nt: number;
  length_codons: number;
  truncated_nt: number;
  warnings: string[];
  internal_stops: number[];
  host_metrics: HostMetrics[];
  best_host_id: string;
  inspector?: HostDetail;
}

/** Output shape returned by codon-host-fit-checker */
export interface CodonHostFitResult {
  tab: WorkspaceTab;
  sequences: SequenceAnalysis[];
  warnings: string[];
  error?: string | null;
  custom_table?: unknown;
  custom_table_error?: string;
  [key: string]: unknown;
}

export class PepkioAPIError extends Error {
  readonly status: number;
  readonly body?: unknown;
  readonly runId?: string;
  readonly code?: string;

  constructor(
    message: string,
    opts: { status: number; body?: unknown; runId?: string; code?: string },
  ) {
    super(message);
    this.name = "PepkioAPIError";
    this.status = opts.status;
    this.body = opts.body;
    this.runId = opts.runId;
    this.code = opts.code;
  }
}
