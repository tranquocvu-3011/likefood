export default function ContactLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="h-5 bg-gray-200 rounded w-40" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-10 bg-gray-100 rounded-lg w-full" />
            </div>
          ))}
          <div className="h-12 bg-gray-200 rounded-lg w-full" />
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-3 bg-gray-200 rounded w-48" />
              </div>
            </div>
          ))}
          <div className="w-full h-48 bg-gray-200 rounded-lg mt-4" />
        </div>
      </div>
    </div>
  );
}
