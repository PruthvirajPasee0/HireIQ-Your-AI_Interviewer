export default function Loading() {
  return (
    <section className="section-feedback animate-pulse">
      <div className="flex flex-col gap-3 items-center text-center">
        <div className="h-8 w-3/4 bg-light-400/20 rounded" />
        <div className="h-4 w-40 bg-light-400/20 rounded" />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="glass-card p-6 flex flex-col items-center justify-center gap-4">
          <div className="rounded-full bg-light-400/20 size-[140px]" />
          <div className="h-4 w-24 bg-light-400/20 rounded" />
        </div>

        <div className="lg:col-span-2 glass-card p-6">
          <div className="h-5 w-24 bg-light-400/20 rounded mb-3" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-light-400/20 rounded" />
            <div className="h-4 w-5/6 bg-light-400/20 rounded" />
            <div className="h-4 w-2/3 bg-light-400/20 rounded" />
          </div>
        </div>
      </div>

      <div className="mt-6 glass-card p-6">
        <div className="h-5 w-40 bg-light-400/20 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 w-full bg-light-400/20 rounded" />
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <div className="h-5 w-32 bg-light-400/20 rounded mb-3" />
          <div className="flex flex-wrap gap-2">
            {[...Array(6)].map((_, i) => (
              <span key={i} className="h-7 w-24 rounded-full bg-light-400/20" />
            ))}
          </div>
        </div>
        <div className="glass-card p-6">
          <div className="h-5 w-48 bg-light-400/20 rounded mb-3" />
          <div className="flex flex-wrap gap-2">
            {[...Array(6)].map((_, i) => (
              <span key={i} className="h-7 w-28 rounded-full bg-light-400/20" />
            ))}
          </div>
        </div>
      </div>

      <div className="buttons mt-6">
        <div className="h-10 bg-light-400/20 rounded flex-1" />
        <div className="h-10 bg-light-400/20 rounded flex-1" />
      </div>
    </section>
  );
}
