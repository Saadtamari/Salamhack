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
      const [dashboard, clients, invoices, transactions, contracts, zakatRecords] = await Promise.all([
        masrafApi.dashboard.get().catch(() => null),
        masrafApi.clients.list(),
        masrafApi.invoices.list({ sort: "created_at" }),
        masrafApi.transactions.list(),
        masrafApi.contracts.list(),
        masrafApi.zakat.list(),
      ]);

      setData(toMasrafDataFromBackend({
        dashboard,
        clients,
        invoices,
        transactions,
        contracts,
        zakatRecords,
      }));
      setConnected(true);
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
