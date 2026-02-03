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
                <div className="flex items-center gap-2">
                  {transcript && (
                    <CopyTranscriptButton transcript={transcript} />
                  )}
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
                  <div className="max-h-[600px] overflow-y-auto">
                    <TranscriptContent
                      segments={transcript?.segments}
                      videoId={videoId}
                      searchQuery={searchQuery}
                    />
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

function CopyTranscriptButton({ transcript }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const fullText = transcript.segments.map((s) => s.text).join(' ');
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
    >
      {copied ? (
        <>
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

function TranscriptContent({ segments, videoId, searchQuery }) {
  if (!segments || segments.length === 0) return null;

  // Group segments into paragraphs (roughly every 30 seconds or at sentence endings)
  const paragraphs = [];
  let currentParagraph = { segments: [], startTime: 0 };

  segments.forEach((segment, index) => {
    if (currentParagraph.segments.length === 0) {
      currentParagraph.startTime = segment.start;
    }
    currentParagraph.segments.push(segment);

    const timeSinceStart = segment.start - currentParagraph.startTime;
    const endsWithPunctuation = /[.!?]$/.test(segment.text.trim());
    const isLongEnough = timeSinceStart >= 25;

    // Start new paragraph after ~30s or at sentence end after 15s
    if ((endsWithPunctuation && timeSinceStart >= 15) || timeSinceStart >= 40 || index === segments.length - 1) {
      paragraphs.push({ ...currentParagraph });
      currentParagraph = { segments: [], startTime: 0 };
    }
  });

  return (
    <div className="prose prose-sm max-w-none space-y-4">
      {paragraphs.map((paragraph, pIndex) => (
        <TranscriptParagraph
          key={pIndex}
          paragraph={paragraph}
          videoId={videoId}
          searchQuery={searchQuery}
        />
      ))}
    </div>
  );
}

function TranscriptParagraph({ paragraph, videoId, searchQuery }) {
  const formatTimestamp = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const timestamp = formatTimestamp(paragraph.startTime);
  const youtubeLink = `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(paragraph.startTime)}`;

  // Combine all segment text
  let fullText = paragraph.segments.map((s) => s.text).join(' ');

  // Highlight search matches
  if (searchQuery) {
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    fullText = fullText.replace(regex, '<mark>$1</mark>');
  }

  return (
    <div className="group relative pl-12 py-2 hover:bg-gray-50 rounded-lg transition-colors">
      <a
        href={youtubeLink}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute left-0 top-2 text-indigo-600 hover:text-indigo-700 text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity"
        title="Jump to this point in video"
      >
        {timestamp}
      </a>
      <p
        className="text-gray-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: fullText }}
      />
    </div>
  );
}

export default VideoPage;
