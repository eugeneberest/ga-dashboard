"use client";

interface TopPage {
  path: string;
  title: string;
  pageviews: number;
  avgTimeOnPage: number;
}

interface TopPagesTableProps {
  pages: TopPage[];
  isLoading?: boolean;
}

export default function TopPagesTable({ pages, isLoading }: TopPagesTableProps) {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Pages</h3>
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Pages</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-2 text-sm font-medium text-gray-500">
                Page
              </th>
              <th className="text-right py-2 px-2 text-sm font-medium text-gray-500">
                Views
              </th>
              <th className="text-right py-2 px-2 text-sm font-medium text-gray-500">
                Avg. Time
              </th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page, index) => (
              <tr key={index} className="border-b border-gray-100 last:border-0">
                <td className="py-3 px-2">
                  <div className="text-sm font-medium text-gray-900 truncate max-w-[300px]">
                    {page.title || page.path}
                  </div>
                  <div className="text-xs text-gray-500 truncate max-w-[300px]">
                    {page.path}
                  </div>
                </td>
                <td className="py-3 px-2 text-right">
                  <span className="text-sm font-semibold text-gray-900">
                    {page.pageviews.toLocaleString()}
                  </span>
                </td>
                <td className="py-3 px-2 text-right">
                  <span className="text-sm text-gray-600">
                    {formatDuration(page.avgTimeOnPage)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pages.length === 0 && (
          <p className="text-center py-4 text-gray-500 text-sm">
            No page data available
          </p>
        )}
      </div>
    </div>
  );
}
