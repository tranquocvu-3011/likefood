export default function AboutLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      <div className="text-center mb-8">
        <div className="h-8 bg-gray-200 rounded w-56 mx-auto mb-4" />
        <div className="h-4 bg-gray-200 rounded w-96 mx-auto" />
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
        <div className="w-full h-64 bg-gray-200 rounded-xl" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-5 bg-gray-200 rounded w-40" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
