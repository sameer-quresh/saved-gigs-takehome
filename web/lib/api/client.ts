import type { ResponseInterface, ResponseKey } from "shared";
import { getPublicEnv } from "@/lib/env";
import { handleResponse } from "@/lib/api/handle-response";
import { useAuthStore } from "@/stores/auth-store";

function getHeaders(init?: RequestInit): HeadersInit {
  const token = useAuthStore.getState().token;
  return {
    ...(init?.headers ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const apiClient = {
  async get<K extends ResponseKey>(
    _key: K,
    path: string,
    init?: RequestInit,
  ): Promise<ResponseInterface<K>> {
    const { apiUrl } = getPublicEnv();
    const response = await fetch(`${apiUrl}${path}`, {
      ...init,
      method: "GET",
      headers: getHeaders(init),
    });
    return handleResponse<ResponseInterface<K>>(response);
  },

  async post<K extends ResponseKey>(
    _key: K,
    path: string,
    body?: unknown,
    init?: RequestInit,
  ): Promise<ResponseInterface<K>> {
    const { apiUrl } = getPublicEnv();
    const response = await fetch(`${apiUrl}${path}`, {
      ...init,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getHeaders(init),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return handleResponse<ResponseInterface<K>>(response);
  },

  async delete(path: string, init?: RequestInit): Promise<void> {
    const { apiUrl } = getPublicEnv();
    const response = await fetch(`${apiUrl}${path}`, {
      ...init,
      method: "DELETE",
      headers: getHeaders(init),
    });
    await handleResponse<void>(response);
  },
};
