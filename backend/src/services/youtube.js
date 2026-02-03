import { Innertube } from 'youtubei.js';

let innertube = null;

async function getInnertube() {
  if (!innertube) {
    innertube = await Innertube.create({
      lang: 'en',
      location: 'US',
      retrieve_player: false,
    });
  }
  return innertube;
}

/**
 * Get channel info by handle (e.g., @startupspod)
 */
export async function getChannelByHandle(handle) {
  const yt = await getInnertube();

  // Remove @ if present
  const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;

  try {
    const channel = await yt.getChannel(cleanHandle);
    return {
      id: channel.metadata.external_id,
      name: channel.metadata.title,
      description: channel.metadata.description,
      subscriberCount: channel.metadata.subscriber_count,
      thumbnail: channel.metadata.thumbnail?.[0]?.url,
    };
  } catch (error) {
    console.error('Error fetching channel:', error);
    throw error;
  }
}

/**
 * Get videos from a channel
 */
export async function getChannelVideos(channelIdOrHandle, maxResults = 50) {
  const yt = await getInnertube();

  try {
    const channel = await yt.getChannel(channelIdOrHandle);
    let videos = [];

    // Get videos tab
    const videosTab = await channel.getVideos();
    let feed = videosTab;

    while (videos.length < maxResults) {
      const newVideos = feed.videos.map((video) => ({
        id: video.id,
        title: video.title?.text || video.title,
        description: video.description_snippet?.text || '',
        thumbnailUrl: video.thumbnails?.[0]?.url || '',
        publishedAt: video.published?.text || '',
        duration: video.duration?.text || '',
        viewCount: parseViewCount(video.view_count?.text || video.short_view_count?.text || '0'),
        channelId: channelIdOrHandle,
      }));

      videos = videos.concat(newVideos);

      if (!feed.has_continuation || videos.length >= maxResults) break;

      feed = await feed.getContinuation();
    }

    return videos.slice(0, maxResults);
  } catch (error) {
    console.error('Error fetching channel videos:', error);
    throw error;
  }
}

/**
 * Get video details
 */
export async function getVideoDetails(videoId) {
  const yt = await getInnertube();

  try {
    const info = await yt.getBasicInfo(videoId);
    return {
      id: videoId,
      title: info.basic_info.title,
      description: info.basic_info.short_description,
      thumbnailUrl: info.basic_info.thumbnail?.[0]?.url,
      publishedAt: info.basic_info.upload_date,
      duration: formatDuration(info.basic_info.duration),
      viewCount: info.basic_info.view_count,
      channelId: info.basic_info.channel_id,
      channelName: info.basic_info.author,
    };
  } catch (error) {
    console.error('Error fetching video details:', error);
    throw error;
  }
}

function parseViewCount(viewText) {
  if (!viewText) return 0;
  const cleaned = viewText.toLowerCase().replace(/[^0-9.kmb]/g, '');
  const num = parseFloat(cleaned);
  if (cleaned.includes('k')) return Math.round(num * 1000);
  if (cleaned.includes('m')) return Math.round(num * 1000000);
  if (cleaned.includes('b')) return Math.round(num * 1000000000);
  return Math.round(num) || 0;
}

function formatDuration(seconds) {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}
