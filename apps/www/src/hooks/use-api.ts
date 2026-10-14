import axios, { AxiosError, type AxiosResponse } from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCookie } from "@/lib/cookies";
import { api } from "@/lib/api";

export function useApi<T = Record<string, unknown>>(_options: { cache?: boolean } = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AxiosError>();
  const [response, setResponse] = useState<AxiosResponse>();
  const [data, setData] = useState<T>();
  const mounted = useRef(false);
  const pending = useRef(0);
  const reads = useRef(new Set<AbortController>());
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; reads.current.forEach((c) => c.abort()); reads.current.clear(); };
  }, []);

  const request = useCallback(async (method: string, url: string, body?: unknown, key?: string) => {
    const controller = method === "GET" ? new AbortController() : undefined;
    if (controller) reads.current.add(controller);
    pending.current++;
    if (mounted.current) { setLoading(true); setError(undefined); }
    const token = getCookie("token");
    const task = api.request({
      method, url, data: body, signal: controller?.signal,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(method !== "GET" ? { "Idempotency-Key": key || crypto.randomUUID() } : {}),
      },
    });
    try {
      const result = await task;
      if (!result.data || typeof result.data !== "object" || typeof result.data.ok !== "boolean") throw new AxiosError("Unexpected API response", "ERR_APPLICATION", result.config, result.request, result);
      if (result.data.ok === false) throw new AxiosError(result.data.toast || result.data.error || "Request failed", "ERR_APPLICATION", result.config, result.request, result);
      if (mounted.current) { setResponse(result); setData(result.data?.data ?? result.data); }
      return result;
    } catch (err) {
      if (mounted.current && axios.isAxiosError(err) && !axios.isCancel(err)) setError(err);
      throw err;
    } finally {
      if (controller) reads.current.delete(controller);
      pending.current = Math.max(0, pending.current - 1);
      if (mounted.current) setLoading(pending.current > 0);
    }
  }, []);
  const get = useCallback((url: string) => request("GET", url), [request]);
  const post = useCallback((url: string, body?: unknown, key?: string) => request("POST", url, body, key), [request]);
  const put = useCallback((url: string, body?: unknown, key?: string) => request("PUT", url, body, key), [request]);
  const patch = useCallback((url: string, body?: unknown, key?: string) => request("PATCH", url, body, key), [request]);
  const del = useCallback((url: string, body?: unknown, key?: string) => request("DELETE", url, body, key), [request]);
  return { get, post, put, patch, delete: del, api, data, loading, error, setData, response };
}
