import { describe, expect, it } from "vitest";
import { PepkioClient } from "../src/client.js";
import { TOOL_ID } from "../src/config.js";

const LOCAL_BASE_URL = "https://tools.localtest.me";
const PRODUCTION_BASE_URL = "https://tools.pepkio.com";

function envConfig(env: "local" | "production") {
  const baseUrl = process.env.PEPKIO_API_BASE_URL
    ? process.env.PEPKIO_API_BASE_URL.replace(/\/$/, "")
    : env === "local"
      ? LOCAL_BASE_URL
      : PRODUCTION_BASE_URL;

  const isLocal = baseUrl.includes("localtest.me");
  const apiKey = isLocal
    ? process.env.LOCAL_PEPKIO_API_KEY ?? process.env.PEPKIO_API_KEY
    : process.env.PEPKIO_API_KEY;

  return { baseUrl, apiKey, isLocal };
}

describe("integration: local", () => {
  const { baseUrl, apiKey } = envConfig("local");

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "fetches manifest",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const manifest = await client.getManifest();

      expect(manifest.tool_id).toBe(TOOL_ID);
      expect(manifest.title).toBe("Codon Host Fit Checker");
      const names = manifest.examples?.map((e) => e.name) ?? [];
      expect(names).toContain("gfp_matrix");
      expect(names).toContain("short_inspector");
    },
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs gfp_matrix",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("gfp_matrix");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.tab).toBe("matrix");
      expect(result.result?.sequences.length).toBeGreaterThan(0);
      const seq = result.result?.sequences[0];
      expect(seq?.length_nt).toBe(720);
      expect(seq?.host_metrics.length).toBe(3);
      expect(seq?.best_host_id).toBe("cho");
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs short_inspector",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("short_inspector");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.tab).toBe("inspector");
      expect(result.result?.sequences[0].inspector?.host_id).toBe("e_coli_bl21");
      expect(result.result?.sequences[0].inspector?.codons.length).toBeGreaterThan(0);
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs checkMatrix helper",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const result = await client.checkMatrix("ATGAAAGTGCTGTGG", ["e_coli_k12"]);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.tab).toBe("matrix");
      expect(result.result?.sequences[0].host_metrics[0].host_id).toBe("e_coli_k12");
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs inspectHost helper",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const result = await client.inspectHost("ATGAAAGTGCTGTGG", "e_coli_bl21");

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.tab).toBe("inspector");
      expect(result.result?.sequences[0].inspector?.host_id).toBe("e_coli_bl21");
    },
    60_000,
  );
});

describe("integration: production", () => {
  const { baseUrl, apiKey } = envConfig("production");

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "fetches manifest",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const manifest = await client.getManifest();

      expect(manifest.tool_id).toBe(TOOL_ID);
      expect(manifest.title).toBe("Codon Host Fit Checker");
      const names = manifest.examples?.map((e) => e.name) ?? [];
      expect(names).toContain("gfp_matrix");
      expect(names).toContain("short_inspector");
    },
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs gfp_matrix",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("gfp_matrix");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.tab).toBe("matrix");
      expect(result.result?.sequences.length).toBeGreaterThan(0);
      const seq = result.result?.sequences[0];
      expect(seq?.length_nt).toBe(720);
      expect(seq?.host_metrics.length).toBe(3);
      expect(seq?.best_host_id).toBe("cho");
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs short_inspector",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("short_inspector");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.tab).toBe("inspector");
      expect(result.result?.sequences[0].inspector?.host_id).toBe("e_coli_bl21");
      expect(result.result?.sequences[0].inspector?.codons.length).toBeGreaterThan(0);
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs checkMatrix helper",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const result = await client.checkMatrix("ATGAAAGTGCTGTGG", ["e_coli_k12"]);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.tab).toBe("matrix");
      expect(result.result?.sequences[0].host_metrics[0].host_id).toBe("e_coli_k12");
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs inspectHost helper",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const result = await client.inspectHost("ATGAAAGTGCTGTGG", "e_coli_bl21");

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.tab).toBe("inspector");
      expect(result.result?.sequences[0].inspector?.host_id).toBe("e_coli_bl21");
    },
    60_000,
  );
});
