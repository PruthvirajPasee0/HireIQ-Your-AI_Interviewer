export default function Loading() {
  return (
    <>
      <div className="flex flex-row gap-4 justify-between animate-pulse">
        <div className="flex flex-row gap-4 items-center max-sm:flex-col">
          <div className="flex flex-row gap-4 items-center">
            <div className="rounded-full bg-light-400/20 size-[40px]" />
            <div className="h-6 w-48 bg-light-400/20 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-12 bg-light-400/20 rounded" />
            <div className="h-6 w-12 bg-light-400/20 rounded" />
            <div className="h-6 w-12 bg-light-400/20 rounded" />
          </div>
        </div>
        <div className="h-8 w-24 bg-light-400/20 rounded-full" />
      </div>

      <div className="glass-card p-6 mt-6 animate-pulse">
        <div className="h-6 w-1/3 bg-light-400/20 rounded mb-4" />
        <div className="h-40 w-full bg-light-400/20 rounded" />
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="h-8 bg-light-400/20 rounded" />
          <div className="h-8 bg-light-400/20 rounded" />
          <div className="h-8 bg-light-400/20 rounded" />
        </div>
      </div>
    </>
  );
}
