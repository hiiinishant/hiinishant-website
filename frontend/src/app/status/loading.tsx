export default function StatusLoading() {
  return (
    <main className="min-h-screen px-5 pb-24 pt-24 sm:px-8" aria-busy="true" aria-label="Loading live updates">
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="mb-8 h-4 w-32 rounded bg-white/10" />
        <div className="mb-4 h-10 w-72 rounded bg-white/10" />
        <div className="mb-12 h-5 w-full max-w-xl rounded bg-white/5" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="h-56 rounded-3xl border border-white/10 bg-white/5" />
          <div className="h-56 rounded-3xl border border-white/10 bg-white/5" />
          <div className="h-56 rounded-3xl border border-white/10 bg-white/5" />
        </div>
      </div>
    </main>
  );
}