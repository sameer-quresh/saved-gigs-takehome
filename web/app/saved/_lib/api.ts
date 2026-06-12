import type { ResponseInterface } from "shared";
import { apiClient } from "@/lib/api/client";

export async function fetchSavedGigs(): Promise<
  ResponseInterface<"saved-gigs/list">
> {
  return apiClient.get("saved-gigs/list", "/api/saved-gigs");
}

export async function unsaveGig(_gigId: number): Promise<void> {
  void _gigId;
}
