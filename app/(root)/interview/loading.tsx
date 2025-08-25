export default function Loading() {
  return (
    <>
      <h3>Interview generation</h3>
      <div className="glass-panel lg:min-w-[566px] w-full">
        <div className="flex flex-col gap-4 py-10 px-8 w-full animate-pulse">
          <div className="h-5 w-1/3 bg-light-400/20 rounded" />
          <div className="space-y-2">
            <div className="h-10 w-full bg-light-400/20 rounded" />
            <div className="h-10 w-full bg-light-400/20 rounded" />
            <div className="h-10 w-full bg-light-400/20 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-8 w-1/2 bg-light-400/20 rounded" />
            <div className="h-10 w-full bg-light-400/20 rounded" />
          </div>
          <div className="h-10 w-32 bg-light-400/30 rounded self-start" />
        </div>
      </div>
    </>
  );
}
