/**
 * LIKEFOOD - Wishlist Loading Skeleton
 */

export default function WishlistLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-pulse">
      <div className="h-8 w-48 bg-slate-200 rounded mb-8" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden">
            <div className="aspect-square bg-slate-200" />
            <div className="p-4 space-y-3">
              <div className="h-4 w-3/4 bg-slate-200 rounded" />
              <div className="h-4 w-1/2 bg-slate-200 rounded" />
              <div className="flex justify-between items-center">
                <div className="h-5 w-16 bg-slate-200 rounded" />
                <div className="h-8 w-20 bg-slate-200 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
