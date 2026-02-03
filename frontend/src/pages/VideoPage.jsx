import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranscript, useApi } from '../hooks/useApi';

function VideoPage() {
  const { videoId } = useParams();
  const { transcript, themes, fetchTranscript, scrapeTranscript, fetchThemes, loading, error } =
    useTranscript(videoId);
  const { get } = useApi();
  const [video, setVideo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [scraping, setScraping] = useState(false);

  useEffect(() => {
    // Fetch video details
    get(`/videos/${videoId}`)
      .then(setVideo)
      .catch(console.error);

    // Try to fetch existing transcript
    fetchTranscript().catch(() => {});
    fetchThemes().catch(() => {});
  }, [videoId, get, fetchTranscript, fetchThemes]);

  const handleScrapeTranscript = async () => {
    setScraping(true);
    try {
      await scrapeTranscript();
    } catch (err) {
      console.error('Failed to scrape transcript:', err);
    } finally {
      setScraping(false);
    }
  };

  const filteredSegments = transcript?.segments?.filter((segment) =>
    searchQuery ? segment.text.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <div>
      <Link to="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-6">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to videos
      </Link>

      {video && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-6">
              <div className="aspect-video bg-gray-900">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{video.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  {video.published_at && <span>{video.published_at}</span>}
                  {video.view_count > 0 && <span>{video.view_count.toLocaleString()} views</span>}
                </div>
                {video.description && (
                  <p className="text-gray-600 whitespace-pre-wrap">{video.description}</p>
                )}
              </div>
            </div>

            {/* Transcript Section */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Transcript</h2>
                {!transcript && (
                  <button
                    onClick={handleScrapeTranscript}
                    disabled={scraping}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {scraping ? 'Fetching...' : 'Fetch Transcript'}
                  </button>
                )}
              </div>

              {loading || scraping ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading transcript...</p>
                </div>
              ) : error && !transcript ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
                  <p>No transcript available yet.</p>
                  <p className="text-sm mt-1">Click "Fetch Transcript" to download it from YouTube.</p>
                </div>
              ) : transcript ? (
                <>
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search in transcript..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="max-h-[600px] overflow-y-auto space-y-1">
                    {filteredSegments?.map((segment, index) => (
                      <TranscriptSegment
                        key={index}
                        segment={segment}
                        videoId={videoId}
                        searchQuery={searchQuery}
                      />
                    ))}
                    {searchQuery && filteredSegments?.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No matches found</p>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* Sidebar - Themes */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Topics & Themes</h2>
              {themes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {themes.slice(0, 30).map((item, index) => (
                    <Link
                      key={index}
                      to={`/search?q=${encodeURIComponent(item.theme)}`}
                      className="inline-flex items-center px-3 py-1 bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 rounded-full text-sm transition-colors"
                    >
                      {item.theme}
                      <span className="ml-1.5 text-xs text-gray-400">{item.frequency}</span>
                    </Link>
                  ))}
                </div>
              ) : transcript ? (
                <p className="text-gray-500 text-sm">Themes will appear after fetching the transcript.</p>
              ) : (
                <p className="text-gray-500 text-sm">Fetch the transcript to see topics and themes.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TranscriptSegment({ segment, videoId, searchQuery }) {
  const minutes = Math.floor(segment.start / 60);
  const seconds = Math.floor(segment.start % 60);
  const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const youtubeLink = `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(segment.start)}`;

  let displayText = segment.text;
  if (searchQuery) {
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    displayText = segment.text.replace(regex, '<mark>$1</mark>');
  }

  return (
    <div className="transcript-segment flex gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
      <a
        href={youtubeLink}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-600 hover:text-indigo-700 text-sm font-mono whitespace-nowrap"
      >
        {timestamp}
      </a>
      <p
        className="text-gray-700 text-sm"
        dangerouslySetInnerHTML={{ __html: displayText }}
      />
    </div>
  );
}

export default VideoPage;
