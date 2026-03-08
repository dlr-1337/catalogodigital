export default function Loading() {
  return (
    <div className="catalog-shell min-h-screen">
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <section className="animate-pulse rounded-[2rem] border border-white/60 bg-white/55 px-6 py-8 shadow-[var(--shadow)]">
          <div className="h-4 w-28 rounded-full bg-panel-strong" />
          <div className="mt-5 h-12 w-72 max-w-full rounded-full bg-panel-strong" />
          <div className="mt-4 h-5 w-full max-w-2xl rounded-full bg-panel-strong" />
        </section>

        <section className="animate-pulse rounded-[1.75rem] border border-white/60 bg-white/55 p-4">
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-10 w-24 shrink-0 rounded-full bg-panel-strong"
              />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-[1.75rem] border border-white/60 bg-white/55 p-3"
            >
              <div className="aspect-[4/5] rounded-[1.5rem] bg-panel-strong" />
              <div className="mt-4 h-4 rounded-full bg-panel-strong" />
              <div className="mt-2 h-3 w-2/3 rounded-full bg-panel-strong" />
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
