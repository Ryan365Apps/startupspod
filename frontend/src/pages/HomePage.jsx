import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useVideos, useApi } from '../hooks/useApi';

function HomePage() {
  const { videos, fetchVideos, fetchChannel, loading, error } = useVideos();
  const { post, loading: fetchingTranscripts } = useApi();
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleSyncChannel = async () => {
    setSyncing(true);
    setSyncStatus('Fetching videos from channel...');
    try {
      const result = await fetchChannel('@startupspod', 50);
      setSyncStatus(`Synced ${result.saved} videos from ${result.channel.name}`);
      await fetchVideos();
    } catch (err) {
      setSyncStatus(`Error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleFetchAllTranscripts = async () => {
    setSyncing(true);
    setSyncStatus('Fetching transcripts (this may take a while)...');
    try {
      const result = await post('/transcripts/fetch-all', { limit: 20, delay: 2000 });
      setSyncStatus(
        `Fetched ${result.succeeded} transcripts. ${result.failed} failed.`
      );
      await fetchVideos();
    } catch (err) {
      setSyncStatus(`Error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const videosWithTranscripts = videos.filter((v) => v.has_transcript).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Startups Pod Transcripts</h1>
        <p className="text-gray-600">
          Browse and search through transcripts from the Startups Pod YouTube channel.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <button
            onClick={handleSyncChannel}
            disabled={syncing}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {syncing ? 'Syncing...' : 'Sync Videos from Channel'}
          </button>
          <button
            onClick={handleFetchAllTranscripts}
            disabled={syncing || videos.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {fetchingTranscripts ? 'Fetching...' : 'Fetch All Transcripts'}
          </button>
        </div>
        {syncStatus && (
          <p className="text-sm text-gray-600">{syncStatus}</p>
        )}
        <p className="text-sm text-gray-500 mt-2">
          {videos.length} videos | {videosWithTranscripts} with transcripts
        </p>
      </div>

      {loading && videos.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading videos...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error: {error}
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <p className="text-gray-600 mb-4">No videos found. Click "Sync Videos from Channel" to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}

function VideoCard({ video }) {
  return (
    <Link
      to={`/video/${video.id}`}
      className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-video bg-gray-100 relative">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No thumbnail
          </div>
        )}
        {video.duration && (
          <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
            {video.duration}
          </span>
        )}
        {video.has_transcript ? (
          <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
            Transcript
          </span>
        ) : null}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">{video.title}</h3>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          {video.published_at && <span>{video.published_at}</span>}
          {video.view_count > 0 && (
            <span>{formatViews(video.view_count)} views</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function formatViews(count) {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export default HomePage;
