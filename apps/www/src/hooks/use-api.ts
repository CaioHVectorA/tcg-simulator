import axios, { AxiosError, AxiosResponse } from "axios";
import { useAuth } from "./use-auth";
import { useRef, useState, useEffect } from "react";
import { getCookie } from "@/lib/cookies";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "./use-toast";

const CACHE = new Map<string, any>();
export function useApi<T extends Record<string, any>>(
  { cache }: { cache?: boolean } = { cache: false }
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AxiosError>();
  const [response, setResponse] = useState<AxiosResponse>();
  const [promise, setPromise] = useState<Promise<AxiosResponse>>();
  const [data, setData] = useState<T>();
  const abortControllerRef = useRef<AbortController>();
  const { loading: loading_token, token } = useAuth();
  const { push } = useRouter();
  const { toast } = useToast();

  // Função para abortar a requisição atual
  // const abort = () => {
  //     if (abortControllerRef.current) {
  //         abortControllerRef.current.abort()
  //         abortControllerRef.current = undefined
  //         setLoading(false)
  //     }
  // }

  // Limpa o controller anterior quando o componente é desmontado
  useEffect(() => {
    return () => {
      // abort()
    };
  }, []);

  const handleError = (err: AxiosError) => {
    // Não mostra erro se foi um cancelamento intencional
    if (axios.isCancel(err)) {
      console.log("Request canceled:", err.message);
      return;
    }
    //@ts-ignore
    console.log({ err: err.response?.data || err });
    setError(err);
    //@ts-ignore
    if (err.response?.status === 401) {
      console.log("unauthorized");
    }
    setLoading(false);
  };

  const createRequestConfig = () => {
    // Cria um novo AbortController para cada requisição
    // abort() // Cancela qualquer requisição pendente
    abortControllerRef.current = new AbortController();

    return {
      headers: {
        Authorization: `Bearer ${token || getCookie("token")}`,
      },
      signal: abortControllerRef.current.signal,
    };
  };

  const get = async (url: string) => {
    if (cache && CACHE.has(url)) {
      setData(CACHE.get(url));
      return { data: CACHE.get(url), status: 200 } as AxiosResponse;
    }
    setLoading(true);
    const config = createRequestConfig();
    const promise = api.get(url, config);
    setPromise(promise);
    promise.catch(handleError);
    const response = await promise;
    if (response.status == 401) push("/entrar");
    setResponse(response);
    setData(response.data.data || response.data);
    CACHE.set(url, response.data.data || response.data);
    setLoading(false);
    if (response.data.toast) toast({ title: response.data.toast });
    return response;
  };

  const post = async (url: string, body: any) => {
    setLoading(true);
    const config = createRequestConfig();
    const promise = api.post(url, body, config);
    setPromise(promise);
    promise.catch(handleError);
    const response = await promise;
    if (response.status == 401) push("/entrar");
    setResponse(response);
    setData(response.data.data || response.data);
    setLoading(false);
    if (response.data.toast) toast({ title: response.data.toast });
    return response;
  };

  const put = async (url: string, body: any) => {
    setLoading(true);
    const config = createRequestConfig();
    const promise = api.put(url, body, config);
    setPromise(promise);
    promise.catch(handleError);
    const response = await promise;
    if (response.status == 401) push("/entrar");
    setResponse(response);
    setData(response.data.data || response.data);
    setLoading(false);
    if (response.data.toast) toast({ title: response.data.toast });
    return response;
  };

  const del = async (url: string, body?: any) => {
    setLoading(true);
    const config = createRequestConfig();
    const promise = api.delete(url, {
      ...config,
      data: body,
    });
    setPromise(promise);
    promise.catch(handleError);
    const response = await promise;
    if (response.status == 401) push("/entrar");
    setResponse(response);
    setData(response.data.data || response.data);
    setLoading(false);
    if (response.data.toast) toast({ title: response.data.toast });
    return response;
  };

  const patch = async (url: string, body: any) => {
    setLoading(true);
    const config = createRequestConfig();
    const promise = api.patch(url, body, config);
    setPromise(promise);
    promise.catch(handleError);
    const response = await promise;
    if (response.status == 401) push("/entrar");
    setResponse(response);
    setData(response.data.data || response.data);
    setLoading(false);
    if (response.data.toast) toast({ title: response.data.toast });
    return response;
  };

  return {
    get,
    post,
    put,
    delete: del,
    api,
    patch,
    data,
    loading,
    promise,
    error,
    setData,
    response,
    // abort // Exportando a função de abort para uso externo
  };
}
