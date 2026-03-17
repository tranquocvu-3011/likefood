/**
 * LIKEFOOD - Checkout Loading Skeleton
 */

export default function CheckoutLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-pulse">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-4 mb-10">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-slate-200 rounded-full" />
            <div className="h-4 w-20 bg-slate-200 rounded hidden sm:block" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form skeleton */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl p-6 space-y-5">
            <div className="h-6 w-48 bg-slate-200 rounded" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                  <div className="h-12 bg-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 space-y-4">
            <div className="h-6 w-40 bg-slate-200 rounded" />
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Order summary skeleton */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl p-6 space-y-4 sticky top-20">
            <div className="h-6 w-32 bg-slate-200 rounded" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-16 h-16 bg-slate-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-slate-200 rounded" />
                  <div className="h-4 w-1/3 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-slate-200 rounded" />
                <div className="h-4 w-16 bg-slate-200 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="h-4 w-16 bg-slate-200 rounded" />
              </div>
              <div className="flex justify-between pt-2">
                <div className="h-6 w-20 bg-slate-200 rounded" />
                <div className="h-6 w-24 bg-slate-200 rounded" />
              </div>
            </div>
            <div className="h-14 bg-slate-200 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
