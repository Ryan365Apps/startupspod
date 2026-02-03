import { Innertube } from 'youtubei.js';

let innertube = null;

async function getInnertube() {
  if (!innertube) {
    innertube = await Innertube.create({
      lang: 'en',
      location: 'US',
      retrieve_player: true,
    });
  }
  return innertube;
}

/**
 * Fetch transcript for a YouTube video
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<{content: string, segments: Array}>}
 */
export async function fetchTranscript(videoId) {
  try {
    const yt = await getInnertube();
    const info = await yt.getInfo(videoId);

    // Get captions from the video info
    const captionTracks = info.captions?.caption_tracks;

    if (!captionTracks || captionTracks.length === 0) {
      throw new Error('No captions available for this video');
    }

    // Prefer English, fallback to first available
    let captionTrack = captionTracks.find(
      (track) => track.language_code === 'en' || track.language_code?.startsWith('en')
    );
    if (!captionTrack) {
      captionTrack = captionTracks[0];
    }

    // Fetch the caption content (in XML format by default, or json3)
    const captionUrl = captionTrack.base_url + '&fmt=json3';
    const response = await fetch(captionUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch captions: ${response.status}`);
    }

    const captionData = await response.json();

    if (!captionData.events || captionData.events.length === 0) {
      throw new Error('No caption events found');
    }

    // Convert to our format with timestamps
    const segments = captionData.events
      .filter((event) => event.segs && event.segs.length > 0)
      .map((event) => ({
        text: event.segs.map((seg) => seg.utf8).join('').trim(),
        start: (event.tStartMs || 0) / 1000,
        duration: (event.dDurationMs || 0) / 1000,
      }))
      .filter((seg) => seg.text); // Remove empty segments

    if (segments.length === 0) {
      throw new Error('No transcript segments found for this video');
    }

    // Combine all text for full-text search
    const content = segments.map((s) => s.text).join(' ');

    return {
      content,
      segments,
    };
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw error;
  }
}

/**
 * Format transcript with timestamps for display
 */
export function formatTranscriptWithTimestamps(segments) {
  return segments.map((segment) => {
    const minutes = Math.floor(segment.start / 60);
    const seconds = Math.floor(segment.start % 60);
    const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    return `[${timestamp}] ${segment.text}`;
  }).join('\n');
}

/**
 * Search within a transcript
 */
export function searchInTranscript(segments, query) {
  const lowerQuery = query.toLowerCase();
  return segments
    .filter((segment) => segment.text.toLowerCase().includes(lowerQuery))
    .map((segment) => ({
      ...segment,
      highlightedText: segment.text.replace(
        new RegExp(`(${query})`, 'gi'),
        '<mark>$1</mark>'
      ),
    }));
}
