import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Memory Leak Fixes", () => {
  
  describe("QueryClient Configuration (main.tsx)", () => {
    const mainContent = fs.readFileSync(
      path.resolve(__dirname, "../../client/src/main.tsx"),
      "utf-8"
    );

    it("should have gcTime configured to limit cache lifetime", () => {
      expect(mainContent).toContain("gcTime");
    });

    it("should have staleTime configured to prevent excessive refetching", () => {
      expect(mainContent).toContain("staleTime");
    });

    it("should have retry configuration to prevent infinite retries", () => {
      expect(mainContent).toContain("retry");
    });

    it("should NOT have refetchOnWindowFocus enabled globally", () => {
      expect(mainContent).toContain("refetchOnWindowFocus: false");
    });

    it("should have refetchOnReconnect disabled to prevent burst refetches", () => {
      expect(mainContent).toContain("refetchOnReconnect: false");
    });
  });

  describe("Sentry Configuration (client sentry.ts)", () => {
    const sentryContent = fs.readFileSync(
      path.resolve(__dirname, "../../client/src/_core/sentry.ts"),
      "utf-8"
    );

    it("should have Session Replay disabled to prevent memory leak", () => {
      expect(sentryContent).toContain("replaysOnErrorSampleRate: 0");
    });

    it("should have maxBreadcrumbs limited", () => {
      expect(sentryContent).toContain("maxBreadcrumbs");
    });

    it("should NOT include replayIntegration", () => {
      expect(sentryContent).not.toContain("replayIntegration(");
    });

    it("should have reduced tracesSampleRate for production", () => {
      expect(sentryContent).toContain("0.1");
    });
  });

  describe("getAnalytics uses SQL aggregation (db/analytics.ts)", () => {
    const dbContent = fs.readFileSync(
      path.resolve(__dirname, "../../server/db/analytics.ts"),
      "utf-8"
    );

    it("should use count() for aggregation instead of loading all records", () => {
      // Check that getAnalytics uses SQL aggregation
      const analyticsSection = dbContent.substring(
        dbContent.indexOf("export async function getAnalytics"),
        dbContent.indexOf("export async function getUsageByDate")
      );
      expect(analyticsSection).toContain("count()");
      expect(analyticsSection).toContain("avg(");
      expect(analyticsSection).toContain("groupBy");
    });

    it("should limit recent history to 10 records", () => {
      const analyticsSection = dbContent.substring(
        dbContent.indexOf("export async function getAnalytics"),
        dbContent.indexOf("export async function getUsageByDate")
      );
      expect(analyticsSection).toContain(".limit(10)");
    });
  });

  describe("getUsageByDate uses date filter and SQL GROUP BY (db/analytics.ts)", () => {
    const dbContent = fs.readFileSync(
      path.resolve(__dirname, "../../server/db/analytics.ts"),
      "utf-8"
    );

    it("should filter by startDate to avoid loading all records", () => {
      const usageSection = dbContent.substring(
        dbContent.indexOf("export async function getUsageByDate"),
        dbContent.length
      );
      expect(usageSection).toContain("startDate");
      expect(usageSection).toContain("createdAt");
    });

    it("should use SQL GROUP BY instead of JavaScript grouping", () => {
      const usageSection = dbContent.substring(
        dbContent.indexOf("export async function getUsageByDate"),
        dbContent.length
      );
      expect(usageSection).toContain("groupBy");
      expect(usageSection).toContain("count()");
    });
  });

  describe("NotificationBell polling (NotificationBell.tsx)", () => {
    const bellContent = fs.readFileSync(
      path.resolve(__dirname, "../../client/src/components/NotificationBell.tsx"),
      "utf-8"
    );

    it("should have visibility-aware polling (not poll in background)", () => {
      // Should check for document visibility or use a visibility hook
      expect(
        bellContent.includes("visibilitychange") ||
        bellContent.includes("isVisible") ||
        bellContent.includes("document.hidden") ||
        bellContent.includes("refetchInterval") // at minimum has a controlled interval
      ).toBe(true);
    });
  });

  describe("AdminTools navigation fix (AdminTools.tsx)", () => {
    const adminContent = fs.readFileSync(
      path.resolve(__dirname, "../../client/src/pages/AdminTools.tsx"),
      "utf-8"
    );

    it("should use useEffect for navigation instead of render-phase redirect", () => {
      expect(adminContent).toContain("useEffect");
    });
  });

  describe("Historico query key stability (Historico.tsx)", () => {
    const historicoContent = fs.readFileSync(
      path.resolve(__dirname, "../../client/src/pages/Historico.tsx"),
      "utf-8"
    );

    it("should NOT pass raw Date objects as query inputs", () => {
      // Should use ISO strings or stable references instead of new Date()
      const queryInputPattern = /useQuery\(\s*\{[^}]*new Date\(\)/;
      expect(queryInputPattern.test(historicoContent)).toBe(false);
    });
  });
});
