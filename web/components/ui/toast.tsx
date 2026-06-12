"use client";

export function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-4 right-4 rounded bg-neutral-900 px-4 py-2 text-sm text-white">
      {message}
    </div>
  );
}
