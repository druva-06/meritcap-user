export default function Loading() {
  return (
    <div className="w-full min-h-[60vh] md:min-h-[70vh] flex items-center justify-center bg-gradient-to-b from-blue-50/40 to-white">
      <div className="w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-3/4 mx-auto rounded-lg bg-slate-200" />
          <div className="h-4 w-2/3 mx-auto rounded bg-slate-200" />
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-40 rounded-xl bg-slate-200" />
            <div className="h-40 rounded-xl bg-slate-200" />
          </div>
          <div className="h-28 rounded-xl bg-slate-200" />
        </div>
      </div>
    </div>
  )
}
