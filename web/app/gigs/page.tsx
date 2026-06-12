"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useSavedGigsStore } from "@/stores/saved-gigs-store";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/handle-response";
import { AccessDenied } from "@/components/ui/access-denied";
import { Skeleton } from "@/components/ui/skeleton";
import { Toast } from "@/components/ui/toast";
import { schema, type SavedList, type GigListItem } from "shared";
import Link from "next/link";
import { cn } from "@/lib/cn";

export default function GigsPage() {
  const token = useAuthStore((state) => state.token);
  const { savedGigIds, setSavedGigIds } = useSavedGigsStore();

  const [gigs, setGigs] = useState<GigListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 6;
  const offset = (page - 1) * limit;

  // Form state for saving a gig
  const [savingGigId, setSavingGigId] = useState<number | null>(null);
  const [activeSaveFormId, setActiveSaveFormId] = useState<number | null>(null);
  const [selectedList, setSelectedList] = useState<SavedList>("WATCHLIST");
  const [saveNote, setSaveNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Toast notifications state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  const fetchGigs = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setForbidden(false);

    try {
      const response = await apiClient.get(
        "gigs/list",
        `/api/gigs?offset=${offset}&limit=${limit}`,
      );
      setGigs(response.items);
      setTotal(response.total);

      // Keep savedGigIds in Zustand in sync with fetched list
      const savedIds = response.items.filter((g) => g.is_saved).map((g) => g.id);
      setSavedGigIds(savedIds);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof ApiError) {
        if (err.status === 403) {
          setForbidden(true);
        } else {
          setError(err.message || "Failed to load gigs.");
        }
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }, [token, offset, limit, setSavedGigIds]);

  useEffect(() => {
    fetchGigs();
  }, [fetchGigs]);

  const handleOpenSaveForm = (gig: GigListItem) => {
    setActiveSaveFormId(gig.id);
    setSelectedList("WATCHLIST");
    setSaveNote("");
    setFormError(null);
  };

  const handleCloseSaveForm = () => {
    setActiveSaveFormId(null);
    setFormError(null);
  };

  const handleSaveSubmit = async (e: React.FormEvent, gigId: number) => {
    e.preventDefault();
    setSavingGigId(gigId);
    setFormError(null);

    // Schema-driven validation
    try {
      schema.savedGigs.save.validate({
        params: { gigId },
        body: { list: selectedList, note: saveNote || undefined },
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
        setSavingGigId(null);
        return;
      }
    }

    try {
      await apiClient.post("saved-gigs/save", `/api/gigs/${gigId}/save`, {
        list: selectedList,
        note: saveNote || null,
      });

      showToast("Gig bookmarked successfully!");
      handleCloseSaveForm();
      fetchGigs(); // Reload to refresh save indicators
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setFormError(err.message || "Failed to save gig.");
        showToast(err.message || "Error saving gig.");
      } else {
        setFormError("An unexpected error occurred.");
      }
    } finally {
      setSavingGigId(null);
    }
  };

  const handleUnsave = async (gigId: number) => {
    setSavingGigId(gigId);
    try {
      await apiClient.delete(`/api/gigs/${gigId}/save`);
      showToast("Gig removed from bookmarks.");
      fetchGigs();
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        showToast(err.message || "Error unsaving gig.");
      } else {
        showToast("An unexpected error occurred.");
      }
    } finally {
      setSavingGigId(null);
    }
  };

  // 1. Signed Out State
  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-white rounded-2xl border border-neutral-100 shadow-sm">
        <h2 className="text-2xl font-extrabold text-neutral-900 tracking-tight">
          Welcome to Saved Gigs
        </h2>
        <p className="mt-2 text-sm text-neutral-500 max-w-sm">
          Please sign in to browse and save available job listings. Choose a profile using our Dev Switcher to get started.
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
        <h2 className="text-xl font-bold text-red-900">Unable to load gigs</h2>
        <p className="mt-2 text-sm text-red-600 max-w-xs">{error}</p>
        <button
          onClick={fetchGigs}
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
            Browse Gigs
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Discover active job listings and bookmark them into custom task flows.
          </p>
        </div>
        <div className="text-sm text-neutral-400 font-medium bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100 self-start">
          Showing <span className="font-semibold text-neutral-800">{gigs.length}</span> of{" "}
          <span className="font-semibold text-neutral-800">{total}</span> gigs
        </div>
      </div>

      {/* 4. Loading state */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
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
      ) : gigs.length === 0 ? (
        // 5. Empty state
        <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-white rounded-2xl border border-neutral-100 shadow-sm">
          <h2 className="text-xl font-bold text-neutral-900">No gigs available</h2>
          <p className="mt-2 text-sm text-neutral-500 max-w-xs">
            There are currently no open gigs on the marketplace. Check back later!
          </p>
        </div>
      ) : (
        // 6. Gigs listing
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gigs.map((gig) => {
              const isSaved = savedGigIds.includes(gig.id);
              const isFormOpen = activeSaveFormId === gig.id;
              const isProcessing = savingGigId === gig.id;

              return (
                <div
                  key={gig.id}
                  className={cn(
                    "group relative flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md",
                    isSaved ? "border-neutral-900" : "border-neutral-100",
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-neutral-900 group-hover:text-neutral-800 transition-colors leading-tight">
                        {gig.title}
                      </h3>
                      {isSaved && (
                        <span className="shrink-0 inline-flex items-center rounded-full bg-neutral-900 px-2.5 py-0.5 text-[10px] font-bold text-white tracking-wide uppercase">
                          Saved
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600 line-clamp-3 leading-relaxed">
                      {gig.description}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="inline-flex items-center rounded bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-800">
                        ${(gig.budget_amount / 100).toFixed(2)}
                      </span>
                      <span className="inline-flex items-center rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 capitalize">
                        {gig.mode}
                      </span>
                    </div>
                  </div>

                  <div className="pt-6">
                    {/* Save Form Drawer Overlay */}
                    {isFormOpen ? (
                      <form
                        onSubmit={(e) => handleSaveSubmit(e, gig.id)}
                        className="mt-2 space-y-4 border-t pt-4 border-neutral-100"
                      >
                        <div>
                          <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">
                            List Category
                          </label>
                          <select
                            value={selectedList}
                            onChange={(e) => setSelectedList(e.target.value as SavedList)}
                            className="w-full text-sm rounded-lg border border-neutral-200 p-2 focus:ring-1 focus:ring-neutral-950 focus:border-neutral-950 outline-none"
                            required
                          >
                            <option value="WATCHLIST">Watchlist</option>
                            <option value="APPLY_LATER">Apply Later</option>
                            <option value="SHORTLIST">Shortlist</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">
                            Optional Note
                          </label>
                          <textarea
                            value={saveNote}
                            onChange={(e) => setSaveNote(e.target.value)}
                            maxLength={280}
                            placeholder="Add notes, deadline, or status..."
                            className="w-full text-sm rounded-lg border border-neutral-200 p-2 h-20 resize-none focus:ring-1 focus:ring-neutral-950 focus:border-neutral-950 outline-none"
                          />
                          <span className="text-[10px] text-neutral-400 block text-right mt-0.5">
                            {saveNote.length}/280
                          </span>
                        </div>

                        {formError && (
                          <p className="text-xs font-medium text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                            {formError}
                          </p>
                        )}

                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={isProcessing}
                            className="flex-1 rounded-lg bg-neutral-900 py-1.5 px-3 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 transition-all duration-200"
                          >
                            {isProcessing ? "Saving..." : "Confirm"}
                          </button>
                          <button
                            type="button"
                            onClick={handleCloseSaveForm}
                            className="rounded-lg border border-neutral-200 bg-white py-1.5 px-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-all duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center gap-2">
                        {isSaved ? (
                          <>
                            <button
                              onClick={() => handleOpenSaveForm(gig)}
                              className="flex-1 rounded-lg border border-neutral-200 bg-white py-2 px-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-all duration-200"
                            >
                              Edit Note
                            </button>
                            <button
                              onClick={() => handleUnsave(gig.id)}
                              disabled={isProcessing}
                              className="rounded-lg bg-red-50 hover:bg-red-100 border border-red-100 p-2 text-red-600 disabled:opacity-50 transition-all duration-200"
                              title="Unsave Gig"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4.5 w-4.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleOpenSaveForm(gig)}
                            className="w-full rounded-lg bg-neutral-900 hover:bg-neutral-800 py-2 px-4 text-center text-xs font-semibold text-white transition-all duration-200 shadow-sm"
                          >
                            Bookmark Gig
                          </button>
                        )}
                      </div>
                    )}
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
