import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PepkioClient } from "../src/client.js";
import {
  DEFAULT_API_BASE_URL,
  TOOL_ID,
  apiPath,
  resolveApiKey,
  resolveBaseUrl,
} from "../src/config.js";
import { parseRunInput } from "../src/schemas.js";
import { PepkioAPIError, type ToolManifest } from "../src/types.js";

const mockManifest: ToolManifest = {
  schema_version: "1.0",
  tool_id: TOOL_ID,
  title: "Codon Host Fit Checker",
  description: "Compare multi-host codon compatibility",
  examples: [
    {
      name: "gfp_matrix",
      description: "Compare GFP across hosts",
      input: {
        tab: "matrix",
        sequence: "ATGGTGAGCAAGGGCGAGGAGCTGTTCACCGGGGTGGTGCCCATCCTGGTCGAGCTGGACGGCGACGTAAACGGCCACAAGTTCAGCGTGTCCGGCGAGGGCGAGGGCGATGCCACCTACGGCAAGCTGACCCTGAAGTTCATCTGCACCACCGGCAAGCTGCCCGTGCCCTGGCCCACCCTCGTGACCACCCTGACCTACGGCGTGCAGTGCTTCAGCCGCTACCCCGACCACATGAAGCAGCACGACTTCTTCAAGTCCGCCATGCCCGAAGGCTACGTCCAGGAGCGCACCATCTTCTTCAAGGACGACGGCAACTACAAGACCCGCGCCGAGGTGAAGTTCGAGGGCGACACCCTGGTGAACCGCATCGAGCTGAAGGGCATCGACTTCAAGGAGGACGGCAACATCCTGGGGCACAAGCTGGAGTACAACTACAACAGCCACAACGTCTATATCATGGCCGACAAGCAGAAGAACGGCATCAAGGTGAACTTCAAGATCCGCCACAACATCGAGGACGGCAGCGTGCAGCTCGCCGACCACTACCAGCAGAACACCCCCATCGGCGACGGCCCCGTGCTGCTGCCCGACAACCACTACCTGAGCACCCAGTCCGCCCTGAGCAAAGACCCCAACGAGAAGCGCGATCACATGGTCCTGCTGGAGTTCGTGACCGCCGCCGGGATCACTCTCGGCATGGACGAGCTGTACAAGTAA",
        host_ids: ["e_coli_k12", "cho", "human_hek293"],
      },
      output: {
        sequences: [{ length_nt: 720 }],
      },
    },
    {
      name: "short_inspector",
      description: "Detailed inspector for short sequence",
      input: {
        tab: "inspector",
        sequence: "ATGAAACGCATTAGCACCACCATTACCACCATTACCACAGGTAACGGTGCGGGCTGACGGGCGTTAAGCTCACTCGGCTGGCTCCAGTGGGATAAGTCGCCTATTGGCGCTCTGCCCGCGTTCCAGTCAGGAAACGCTGGTAA",
        host_ids: ["e_coli_bl21"],
        inspector_host_id: "e_coli_bl21",
      },
      output: {
        sequences: [{ inspector: { host_id: "e_coli_bl21" } }],
      },
    },
  ],
};

describe("PepkioClient unit tests", () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = { ...originalEnv };
  });

  it("getManifest() fetches and returns tool_id", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockManifest),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    const manifest = await client.getManifest();

    expect(manifest.tool_id).toBe(TOOL_ID);
    expect(manifest.title).toBe("Codon Host Fit Checker");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${DEFAULT_API_BASE_URL}/api/tools/v1/tools/${TOOL_ID}/manifest`,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("caches getManifest() calls", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockManifest),
    } as unknown as Response);
    globalThis.fetch = fetchMock;

    const client = new PepkioClient({ apiKey: "test-key" });
    await client.getManifest();
    await client.getManifest();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("listExamples() extracts examples from manifest", () => {
    const client = new PepkioClient({ apiKey: "test-key" });
    const examples = client.listExamples(mockManifest);
    expect(examples).toHaveLength(2);
    expect(examples[0].name).toBe("gfp_matrix");
    expect(examples[1].name).toBe("short_inspector");
  });

  it("getExampleInput() retrieves and parses example", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockManifest),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    const input = await client.getExampleInput("gfp_matrix");
    expect(input.tab).toBe("matrix");
    expect(input.sequence).toContain("ATGGTGAGCAAG");
    expect(input.host_ids).toEqual(["e_coli_k12", "cho", "human_hek293"]);
  });

  it("getExampleInput() throws on unknown example name", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockManifest),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    await expect(client.getExampleInput("nonexistent")).rejects.toThrow(
      /Example "nonexistent" not found/,
    );
  });

  it("run() sends validated input and options", async () => {
    const mockResponse = {
      run_id: "run-123",
      status: "completed",
      result: {
        tab: "matrix",
        sequences: [{ length_nt: 720 }],
        warnings: [],
      },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockResponse),
    } as unknown as Response);

    const client = new PepkioClient({
      apiKey: "secret-key",
      baseUrl: "https://tools.pepkio.com",
    });

    const res = await client.run(
      { tab: "matrix", sequence: "ATGAAA" },
      { label: "my-label", idempotency_key: "idem-key" },
    );

    expect(res.run_id).toBe("run-123");
    expect(res.status).toBe("completed");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://tools.pepkio.com/api/tools/v1/tools/codon-host-fit-checker/run",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer secret-key",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          input: {
            tab: "matrix",
            sequence: "ATGAAA",
          },
          options: {
            label: "my-label",
            idempotency_key: "idem-key",
          },
        }),
      }),
    );
  });

  it("run() throws 401 when apiKey is missing", async () => {
    delete process.env.PEPKIO_API_KEY;
    delete process.env.LOCAL_PEPKIO_API_KEY;

    const client = new PepkioClient();
    await expect(
      client.run({ tab: "matrix", sequence: "ATG" }),
    ).rejects.toThrow(PepkioAPIError);
  });

  it("helper methods call run() with appropriate parameters", async () => {
    const client = new PepkioClient({ apiKey: "test-key" });
    const runSpy = vi.spyOn(client, "run").mockResolvedValue({
      run_id: "r1",
      status: "completed",
    });

    // checkMatrix
    await client.checkMatrix("ATGAAAGTGCTGTGG", ["e_coli_k12", "cho"], {
      rareCodonThreshold: 0.15,
      gcWindowBp: 60,
    });
    expect(runSpy).toHaveBeenCalledWith(
      {
        tab: "matrix",
        sequence: "ATGAAAGTGCTGTGG",
        host_ids: ["e_coli_k12", "cho"],
        rare_codon_threshold: 0.15,
        gc_window_bp: 60,
        check_cis_elements: undefined,
        check_restriction_sites: undefined,
        restriction_enzymes: undefined,
        custom_codon_table: undefined,
        custom_host_name: undefined,
      },
      undefined,
    );

    // inspectHost
    await client.inspectHost("ATGAAAGTGCTGTGG", "e_coli_bl21", {
      checkCisElements: true,
    });
    expect(runSpy).toHaveBeenCalledWith(
      {
        tab: "inspector",
        sequence: "ATGAAAGTGCTGTGG",
        host_ids: ["e_coli_bl21"],
        inspector_host_id: "e_coli_bl21",
        rare_codon_threshold: undefined,
        gc_window_bp: undefined,
        check_cis_elements: true,
        check_restriction_sites: undefined,
        restriction_enzymes: undefined,
      },
      undefined,
    );

    // batchBenchmark
    await client.batchBenchmark(">seq1\nATGAAA\n>seq2\nATGTTT", ["e_coli_k12"]);
    expect(runSpy).toHaveBeenCalledWith(
      {
        tab: "batch",
        fasta_text: ">seq1\nATGAAA\n>seq2\nATGTTT",
        host_ids: ["e_coli_k12"],
        rare_codon_threshold: undefined,
        gc_window_bp: undefined,
        check_cis_elements: undefined,
        check_restriction_sites: undefined,
        restriction_enzymes: undefined,
      },
      undefined,
    );
  });

  it("getRun() fetches previous run by ID", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          run_id: "prev-run-456",
          status: "completed",
          result: { tab: "matrix" },
        }),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    const run = await client.getRun("prev-run-456");

    expect(run.run_id).toBe("prev-run-456");
    expect(run.status).toBe("completed");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${DEFAULT_API_BASE_URL}/api/tools/v1/runs/prev-run-456`,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("waitForRun() polls until run is completed", async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      callCount += 1;
      if (callCount < 2) {
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ run_id: "poll-1", status: "running" }),
        } as unknown as Response;
      }
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            run_id: "poll-1",
            status: "completed",
            result: { tab: "matrix" },
          }),
      } as unknown as Response;
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    const result = await client.waitForRun("poll-1", { intervalMs: 10, timeoutMs: 500 });
    expect(result.status).toBe("completed");
    expect(callCount).toBe(2);
  });

  it("waitForRun() throws on timeout", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ run_id: "timeout-run", status: "running" }),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    await expect(
      client.waitForRun("timeout-run", { intervalMs: 20, timeoutMs: 50 }),
    ).rejects.toThrow(/Timed out/);
  });

  it("throws PepkioAPIError on HTTP 500 error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => JSON.stringify({ error: "Something broke internally" }),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    await expect(client.run({ tab: "matrix", sequence: "ATG" })).rejects.toThrow(
      "Something broke internally",
    );
  });

  it("throws PepkioAPIError when error field is present in 200 response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          run_id: "err-run",
          status: "failed",
          error: "Invalid sequence character",
        }),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    await expect(client.run({ tab: "matrix", sequence: "XYZ" })).rejects.toThrow(
      "Invalid sequence character",
    );
  });

  describe("config helpers", () => {
    it("resolveBaseUrl handles custom and default values", () => {
      expect(resolveBaseUrl("https://custom.pepkio.com/")).toBe("https://custom.pepkio.com");
      delete process.env.PEPKIO_API_BASE_URL;
      expect(resolveBaseUrl()).toBe(DEFAULT_API_BASE_URL);

      process.env.PEPKIO_API_BASE_URL = "https://env.pepkio.com/";
      expect(resolveBaseUrl()).toBe("https://env.pepkio.com");
    });

    it("resolveApiKey prefers explicit key, then LOCAL vs production", () => {
      expect(resolveApiKey("https://tools.pepkio.com", "explicit-key")).toBe("explicit-key");

      process.env.PEPKIO_API_KEY = "prod-key";
      process.env.LOCAL_PEPKIO_API_KEY = "local-key";

      expect(resolveApiKey("https://tools.localtest.me")).toBe("local-key");
      expect(resolveApiKey("https://tools.pepkio.com")).toBe("prod-key");
    });

    it("apiPath builds correct URLs", () => {
      expect(apiPath("https://tools.pepkio.com", "/tools/test")).toBe(
        "https://tools.pepkio.com/api/tools/v1/tools/test",
      );
      expect(apiPath("https://tools.pepkio.com", "runs/123")).toBe(
        "https://tools.pepkio.com/api/tools/v1/runs/123",
      );
    });
  });

  describe("schema parsing", () => {
    it("validates valid input and sets defaults", () => {
      const parsed = parseRunInput({ sequence: "ATG" });
      expect(parsed.tab).toBe("matrix");
      expect(parsed.sequence).toBe("ATG");
    });

    it("throws on invalid tab value", () => {
      expect(() => parseRunInput({ tab: "invalid_tab" })).toThrow();
    });
  });
});
