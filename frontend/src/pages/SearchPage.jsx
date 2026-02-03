import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useSearch } from '../hooks/useApi';

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const { results, search, loading, error } = useSearch();

  useEffect(() => {
    if (initialQuery) {
      search(initialQuery);
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query });
      search(query);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Transcripts</h1>
        <p className="text-gray-600">
          Search across all video transcripts to find specific topics or quotes.
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search for topics, quotes, or keywords... (use "quotes" for exact phrases)'
            className="flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
          Error: {error}
        </div>
      )}

      {results.length > 0 ? (
        <div className="space-y-4">
          <p className="text-gray-600">Found {results.length} results</p>
          {results.map((result, index) => (
            <SearchResult key={index} result={result} />
          ))}
        </div>
      ) : query && !loading ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <p className="text-gray-600">No results found for "{query}"</p>
          <p className="text-gray-500 text-sm mt-2">
            Try different keywords or make sure transcripts have been fetched.
          </p>
        </div>
      ) : !query ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <p className="text-gray-600">Enter a search query to find content across all transcripts.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {['fundraising', 'product market fit', 'growth', 'hiring', 'AI'].map((term) => (
              <button
                key={term}
                onClick={() => {
                  setQuery(term);
                  setSearchParams({ q: term });
                  search(term);
                }}
                className="px-3 py-1 bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 rounded-full text-sm transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SearchResult({ result }) {
  return (
    <Link
      to={`/video/${result.id}`}
      className="block bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex gap-4">
        {result.thumbnail_url && (
          <img
            src={result.thumbnail_url}
            alt={result.title}
            className="w-40 h-24 object-cover rounded-lg flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{result.title}</h3>
          {result.published_at && (
            <p className="text-sm text-gray-500 mb-2">{result.published_at}</p>
          )}
          {result.snippet && (
            <p
              className="text-sm text-gray-600 line-clamp-3"
              dangerouslySetInnerHTML={{ __html: result.snippet }}
            />
          )}
        </div>
      </div>
    </Link>
  );
}

export default SearchPage;
