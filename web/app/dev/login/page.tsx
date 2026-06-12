"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

interface Profile {
  name: string;
  email: string;
  token: string | null;
  role: string;
  permissions: string[];
  description: string;
}

const PROFILES: Profile[] = [
  {
    name: "Alice Smith",
    email: "alice@example.com",
    token: "user-1-token",
    role: "User 1 (Admin/Full Access)",
    permissions: ["Create:SavedGig", "Read:SavedGig", "Delete:SavedGig"],
    description: "Seeded user 1. Can create, view, and delete saved gigs. Owns Gig 1, Gig 4, Gig 6 (closed).",
  },
  {
    name: "Bob Jones",
    email: "bob@example.com",
    token: "user-2-token",
    role: "User 2 (Admin/Full Access)",
    permissions: ["Create:SavedGig", "Read:SavedGig", "Delete:SavedGig"],
    description: "Seeded user 2. Can create, view, and delete saved gigs. Owns Gig 2, Gig 5, Gig 7 (closed).",
  },
  {
    name: "Alice Smith (Read-only)",
    email: "alice@example.com",
    token: "user-1-token",
    role: "User 1 (Limited Access)",
    permissions: ["Read:SavedGig", "Delete:SavedGig"],
    description: "Read-only profile. Lacks 'Create:SavedGig' permission. Useful for testing 403 Forbidden states.",
  },
  {
    name: "Guest (Invalid Token)",
    email: "unknown@example.com",
    token: "invalid-token-here",
    role: "Unauthorized User",
    permissions: [],
    description: "Simulates an expired or invalid authentication token. Useful for testing 401 Unauthorized states.",
  },
];

export default function DevLoginPage() {
  const { token: currentToken, setToken, signOut } = useAuthStore();
  const router = useRouter();

  const handleSelect = (token: string | null) => {
    if (token) {
      setToken(token);
    } else {
      signOut();
    }
    router.push("/gigs");
  };

  return (
    <section className="mx-auto max-w-3xl py-12 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
          Dev Auth Switcher
        </h1>
        <p className="mt-4 text-base text-neutral-500">
          Swap active authentication sessions on the fly to test different permissions, edge cases, and ownership rules.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {PROFILES.map((profile) => {
          const isActive = currentToken === profile.token;
          return (
            <div
              key={profile.name}
              className={cn(
                "relative flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md",
                isActive
                  ? "border-neutral-900 ring-2 ring-neutral-900"
                  : "border-neutral-200 hover:border-neutral-300",
              )}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-neutral-900">{profile.name}</h2>
                  {isActive && (
                    <span className="inline-flex items-center rounded-full bg-neutral-900 px-2.5 py-0.5 text-xs font-semibold text-white">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">{profile.email}</p>
                <p className="mt-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {profile.role}
                </p>
                <p className="mt-3 text-sm text-neutral-600 leading-relaxed">
                  {profile.description}
                </p>

                {profile.permissions.length > 0 ? (
                  <div className="mt-4">
                    <span className="text-xs font-semibold text-neutral-400 block mb-1">
                      Permissions:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {profile.permissions.map((perm) => (
                        <span
                          key={perm}
                          className="inline-flex items-center rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-800"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <span className="text-xs font-semibold text-red-500 block mb-1">
                      No Permissions
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleSelect(profile.token)}
                className={cn(
                  "mt-6 w-full rounded-xl py-2 px-4 text-center text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-neutral-100 text-neutral-900 cursor-default"
                    : "bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm",
                )}
                disabled={isActive}
              >
                {isActive ? "Currently Active" : "Switch to Profile"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={() => handleSelect(null)}
          className={cn(
            "rounded-xl py-2 px-6 text-sm font-semibold transition-all duration-200 border",
            !currentToken
              ? "bg-red-50 border-red-200 text-red-700 cursor-default"
              : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50",
          )}
          disabled={!currentToken}
        >
          {!currentToken ? "Already Signed Out" : "Sign Out / Simulate Guest"}
        </button>
      </div>
    </section>
  );
}
