import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useThemes } from '../hooks/useApi';

function ThemesPage() {
  const { themes, fetchThemes, loading, error } = useThemes();

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  // Calculate max frequency for scaling
  const maxFrequency = Math.max(...themes.map((t) => t.total_frequency), 1);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Topics & Themes</h1>
        <p className="text-gray-600">
          Explore the most discussed topics across all Startups Pod episodes.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading themes...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error: {error}
        </div>
      ) : themes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <p className="text-gray-600">No themes found yet.</p>
          <p className="text-gray-500 text-sm mt-2">
            Fetch transcripts from videos to extract themes and topics.
          </p>
        </div>
      ) : (
        <>
          {/* Tag Cloud */}
          <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Theme Cloud</h2>
            <div className="flex flex-wrap gap-3 justify-center">
              {themes.map((theme, index) => {
                const scale = theme.total_frequency / maxFrequency;
                const fontSize = 0.75 + scale * 1.5; // 0.75rem to 2.25rem
                const opacity = 0.5 + scale * 0.5;

                return (
                  <Link
                    key={index}
                    to={`/search?q=${encodeURIComponent(theme.theme)}`}
                    className="hover:text-indigo-600 transition-colors"
                    style={{
                      fontSize: `${fontSize}rem`,
                      opacity,
                    }}
                  >
                    {theme.theme}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Theme List */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <h2 className="text-lg font-semibold text-gray-900 p-6 border-b">All Themes</h2>
            <div className="divide-y">
              {themes.map((theme, index) => (
                <Link
                  key={index}
                  to={`/search?q=${encodeURIComponent(theme.theme)}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">{theme.theme}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      {theme.video_count} video{theme.video_count !== 1 ? 's' : ''}
                    </span>
                    <div className="w-32 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full"
                        style={{
                          width: `${(theme.total_frequency / maxFrequency) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-400 w-12 text-right">
                      {theme.total_frequency}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ThemesPage;
