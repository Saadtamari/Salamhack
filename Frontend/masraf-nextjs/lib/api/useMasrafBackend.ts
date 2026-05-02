"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MASRAF_DATA } from "@/lib/data";
import { apiConfig } from "./client";
import { masrafApi } from "./masraf-api";
import { toMasrafDataFromBackend, type MasrafData } from "./adapters";

type BackendState = {
  data: MasrafData;
  loading: boolean;
  connected: boolean;
  usingMock: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useMasrafBackend(enabled = apiConfig.useBackend): BackendState {
  const [data, setData] = useState<MasrafData>(MASRAF_DATA);
  const [loading, setLoading] = useState(enabled);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled) {
      setData(MASRAF_DATA);
      setLoading(false);
      setConnected(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const failures: string[] = [];
      let successfulRequests = 0;
      const safe = async <T,>(label: string, task: Promise<T>, fallback: T): Promise<T> => {
        try {
          const result = await task;
          successfulRequests += 1;
          return result;
        } catch (caught) {
          failures.push(label);
          if (apiConfig.strictBackend) {
            throw caught;
          }
          return fallback;
        }
      };

      const [dashboard, clients, invoices, transactions, contracts, zakatRecords] = await Promise.all([
        safe("dashboard", masrafApi.dashboard.get(), null),
        safe("clients", masrafApi.clients.list(), []),
        safe("invoices", masrafApi.invoices.list({ sort: "created_at" }), []),
        safe("transactions", masrafApi.transactions.list(), []),
        safe("contracts", masrafApi.contracts.list(), []),
        safe("zakat", masrafApi.zakat.list(), []),
      ]);

      if (successfulRequests === 0) {
        throw new Error("Could not connect to the backend");
      }

      setData(toMasrafDataFromBackend({
        dashboard,
        clients,
        invoices,
        transactions,
        contracts,
        zakatRecords,
      }));
      setConnected(true);
      setError(failures.length ? `Partial backend data: ${failures.join(", ")}` : null);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not connect to the backend";
      setConnected(false);
      setError(message);

      if (apiConfig.strictBackend) {
        throw caught;
      }

      setData(MASRAF_DATA);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void Promise.resolve().then(refetch);
  }, [refetch]);

  return useMemo(() => ({
    data,
    loading,
    connected,
    usingMock: !enabled || !connected,
    error,
    refetch,
  }), [connected, data, enabled, error, loading, refetch]);
}

export function useBackendHealth(enabled = apiConfig.useBackend) {
  const [status, setStatus] = useState<"mock" | "checking" | "online" | "offline">(enabled ? "checking" : "mock");

  useEffect(() => {
    let active = true;

    if (!enabled) {
      return;
    }

    void Promise.resolve()
      .then(() => {
        if (active) setStatus("checking");
        return masrafApi.health();
      })
      .then(() => {
        if (active) setStatus("online");
      })
      .catch(() => {
        if (active) setStatus("offline");
      });

    return () => {
      active = false;
    };
  }, [enabled]);

  return enabled ? status : "mock";
}
