import type { ResponseInterface } from "shared";
import { apiClient } from "@/lib/api/client";

export async function fetchGigs(): Promise<ResponseInterface<"gigs/list">> {
  return apiClient.get("gigs/list", "/api/gigs");
}
