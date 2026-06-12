"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";

export function UserSwitcher() {
  const token = useAuthStore((state) => state.token);

  let label = "Guest (Signed Out)";
  if (token === "user-1-token") {
    label = "Alice Smith (Full)";
  } else if (token === "user-2-token") {
    label = "Bob Jones (Full)";
  } else if (token === "user-1-readonly-token") {
    label = "Alice Smith (Read-only)";
  } else if (token) {
    label = "Simulated Guest (Invalid Token)";
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="font-medium text-neutral-500">Active Profile:</span>
      <span
        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${
          token && token !== "invalid-token-here"
            ? "bg-neutral-900 text-white"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}
      >
        {label}
      </span>
      <Link
        href="/dev/login"
        className="text-xs text-neutral-500 hover:text-neutral-900 underline underline-offset-4 transition-all duration-200"
      >
        Switch
      </Link>
    </div>
  );
}
