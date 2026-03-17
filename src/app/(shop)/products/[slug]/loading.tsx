/**
 * LIKEFOOD - Product Detail Loading Skeleton
 * Displays while product data is being fetched
 */

export default function ProductDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-4 w-16 bg-slate-200 rounded" />
        <div className="h-4 w-4 bg-slate-200 rounded" />
        <div className="h-4 w-24 bg-slate-200 rounded" />
        <div className="h-4 w-4 bg-slate-200 rounded" />
        <div className="h-4 w-32 bg-slate-200 rounded" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery Skeleton */}
        <div className="space-y-4">
          <div className="aspect-square bg-slate-200 rounded-2xl" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-20 h-20 bg-slate-200 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Product Info Skeleton */}
        <div className="space-y-6">
          {/* Badge */}
          <div className="h-6 w-24 bg-emerald-100 rounded-full" />

          {/* Title */}
          <div className="space-y-2">
            <div className="h-8 w-3/4 bg-slate-200 rounded" />
            <div className="h-8 w-1/2 bg-slate-200 rounded" />
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-5 h-5 bg-slate-200 rounded" />
              ))}
            </div>
            <div className="h-4 w-20 bg-slate-200 rounded" />
          </div>

          {/* Price */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-24 bg-slate-200 rounded" />
            <div className="h-6 w-16 bg-slate-200 rounded" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-200 rounded" />
            <div className="h-4 w-full bg-slate-200 rounded" />
            <div className="h-4 w-3/4 bg-slate-200 rounded" />
          </div>

          {/* Variant options */}
          <div className="space-y-3">
            <div className="h-5 w-20 bg-slate-200 rounded" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 w-24 bg-slate-200 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Quantity + Add to cart */}
          <div className="flex gap-4">
            <div className="h-12 w-32 bg-slate-200 rounded-lg" />
            <div className="h-12 flex-1 bg-slate-200 rounded-lg" />
          </div>

          {/* Shipping info */}
          <div className="p-4 bg-slate-50 rounded-xl space-y-2">
            <div className="h-4 w-48 bg-slate-200 rounded" />
            <div className="h-4 w-64 bg-slate-200 rounded" />
          </div>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="mt-12 space-y-6">
        <div className="flex gap-4 border-b pb-3">
          {["Mô tả", "Đánh giá", "FAQ"].map((_, i) => (
            <div key={i} className="h-8 w-24 bg-slate-200 rounded" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-slate-200 rounded" style={{ width: `${90 - i * 10}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
