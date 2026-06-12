"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useSavedGigsStore } from "@/stores/saved-gigs-store";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/handle-response";
import { AccessDenied } from "@/components/ui/access-denied";
import { Skeleton } from "@/components/ui/skeleton";
import { Toast } from "@/components/ui/toast";
import { SavedListLabel, type SavedList, type SavedGigItem } from "shared";
import Link from "next/link";
import { cn } from "@/lib/cn";

export default function SavedPage() {
  const token = useAuthStore((state) => state.token);
  const { activeListFilter, setActiveListFilter } = useSavedGigsStore();

  const [savedGigs, setSavedGigs] = useState<SavedGigItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 6;
  const offset = (page - 1) * limit;

  // Processing state for unsave button
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Toast notifications state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  const fetchSavedGigs = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setForbidden(false);

    try {
      const filterQuery = activeListFilter ? `&list=${activeListFilter}` : "";
      const response = await apiClient.get(
        "saved-gigs/list",
        `/api/saved-gigs?offset=${offset}&limit=${limit}${filterQuery}`,
      );
      setSavedGigs(response.items);
      setTotal(response.total);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof ApiError) {
        if (err.status === 403) {
          setForbidden(true);
        } else {
          setError(err.message || "Failed to load saved gigs.");
        }
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }, [token, offset, limit, activeListFilter]);

  useEffect(() => {
    fetchSavedGigs();
  }, [fetchSavedGigs]);

  // Handle active filter change
  const handleFilterChange = (filter: SavedList | null) => {
    setActiveListFilter(filter);
    setPage(1); // Reset to first page
  };

  const handleUnsave = async (gigId: number) => {
    setDeletingId(gigId);
    try {
      // Optimistic UI update: remove from current list view
      setSavedGigs((prev) => prev.filter((g) => g.gig_id !== gigId));
      setTotal((t) => Math.max(0, t - 1));

      await apiClient.delete(`/api/gigs/${gigId}/save`);
      showToast("Removed from bookmarks.");

      // Soft refetch to ensure alignment and correct pagination boundary
      fetchSavedGigs();
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        showToast(err.message || "Error unsaving gig.");
      } else {
        showToast("An unexpected error occurred.");
      }
      fetchSavedGigs(); // Revert optimistic changes on failure
    } finally {
      setDeletingId(null);
    }
  };

  // 1. Signed Out State
  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-white rounded-2xl border border-neutral-100 shadow-sm">
        <h2 className="text-2xl font-extrabold text-neutral-900 tracking-tight">
          My Bookmarked Gigs
        </h2>
        <p className="mt-2 text-sm text-neutral-500 max-w-sm">
          Please sign in to view your saved listings. Choose a profile using our Dev Switcher to get started.
        </p>
        <Link
          href="/dev/login"
          className="mt-6 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-neutral-800 transition-all duration-200"
        >
          Go to Dev Switcher
        </Link>
      </div>
    );
  }

  // 2. Forbidden State (403 Access Denied)
  if (forbidden) {
    return (
      <div className="py-12">
        <AccessDenied />
      </div>
    );
  }

  // 3. Error State with Retry
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-red-50 rounded-2xl border border-red-100">
        <h2 className="text-xl font-bold text-red-900">Unable to load saved gigs</h2>
        <p className="mt-2 text-sm text-red-600 max-w-xs">{error}</p>
        <button
          onClick={fetchSavedGigs}
          className="mt-6 rounded-xl bg-red-900 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 transition-all duration-200"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
          My Saved Gigs
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Manage your bookmark pipelines, lists, and reference notes.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-neutral-100 pb-4">
        <button
          onClick={() => handleFilterChange(null)}
          className={cn(
            "rounded-lg px-4 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200",
            activeListFilter === null
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
          )}
        >
          All
        </button>
        <button
          onClick={() => handleFilterChange("WATCHLIST")}
          className={cn(
            "rounded-lg px-4 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200",
            activeListFilter === "WATCHLIST"
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
          )}
        >
          {SavedListLabel.WATCHLIST}
        </button>
        <button
          onClick={() => handleFilterChange("APPLY_LATER")}
          className={cn(
            "rounded-lg px-4 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200",
            activeListFilter === "APPLY_LATER"
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
          )}
        >
          {SavedListLabel.APPLY_LATER}
        </button>
        <button
          onClick={() => handleFilterChange("SHORTLIST")}
          className={cn(
            "rounded-lg px-4 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200",
            activeListFilter === "SHORTLIST"
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
          )}
        >
          {SavedListLabel.SHORTLIST}
        </button>
      </div>

      {/* 4. Loading state */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex flex-col justify-between h-48 p-6 rounded-2xl border border-neutral-100 bg-white"
            >
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="h-8 w-24 rounded-lg mt-4" />
            </div>
          ))}
        </div>
      ) : savedGigs.length === 0 ? (
        // 5. Empty state
        <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-white rounded-2xl border border-neutral-100 shadow-sm">
          <h2 className="text-xl font-bold text-neutral-900">No saved gigs found</h2>
          <p className="mt-2 text-sm text-neutral-500 max-w-xs">
            {activeListFilter
              ? `You haven't bookmarked any gigs under the "${SavedListLabel[activeListFilter as SavedList]}" filter category.`
              : "You haven't bookmarked any gigs yet. Browse open listings to add them to your pipelines."}
          </p>
          {!activeListFilter && (
            <Link
              href="/gigs"
              className="mt-6 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-neutral-800 transition-all duration-200"
            >
              Browse Open Gigs
            </Link>
          )}
        </div>
      ) : (
        // 6. Saved Gigs listing
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {savedGigs.map((item) => {
              const isClosed = item.gig_status === "closed";
              const isProcessing = deletingId === item.gig_id;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md",
                    isClosed
                      ? "border-neutral-200 bg-neutral-50/50 opacity-80"
                      : "border-neutral-100",
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className={cn(
                          "font-bold leading-tight text-neutral-900",
                          isClosed && "line-through text-neutral-400",
                        )}
                      >
                        {item.gig_title}
                      </h3>
                      {isClosed ? (
                        <span className="shrink-0 inline-flex items-center rounded-full bg-red-50 border border-red-100 px-2 py-0.5 text-[9px] font-bold text-red-600 tracking-wide uppercase">
                          Closed
                        </span>
                      ) : (
                        <span className="shrink-0 inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-semibold text-neutral-700">
                          {SavedListLabel[item.list as SavedList]}
                        </span>
                      )}
                    </div>

                    {item.note ? (
                      <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-100">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                          My Note
                        </span>
                        <p className="text-sm text-neutral-700 leading-relaxed italic">
                          "{item.note}"
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-400 italic">No notes added.</p>
                    )}

                    <div className="text-[10px] text-neutral-400 font-medium pt-2 block">
                      Saved on {new Date(item.created_on).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-neutral-100 mt-4 flex gap-2">
                    <button
                      onClick={() => handleUnsave(item.gig_id)}
                      disabled={isProcessing}
                      className="w-full rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 py-2 px-4 text-center text-xs font-semibold text-white transition-all duration-200"
                    >
                      {isProcessing ? "Removing..." : "Remove Bookmark"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-neutral-100 pt-6 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-xl border border-neutral-200 bg-white py-2 px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:hover:bg-white transition-all duration-200"
              >
                Previous
              </button>
              <span className="text-sm font-medium text-neutral-500">
                Page <span className="font-semibold text-neutral-800">{page}</span> of{" "}
                <span className="font-semibold text-neutral-800">{totalPages}</span>
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-xl border border-neutral-200 bg-white py-2 px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:hover:bg-white transition-all duration-200"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Toast Banner rendering */}
      {toastMessage && <Toast message={toastMessage} />}
    </section>
  );
}
