export function AccessDenied() {
  return (
    <section className="rounded border border-red-200 bg-red-50 p-6 text-red-800">
      <h2 className="text-lg font-semibold">Access denied</h2>
      <p className="mt-2 text-sm">You do not have permission to view this page.</p>
    </section>
  );
}
