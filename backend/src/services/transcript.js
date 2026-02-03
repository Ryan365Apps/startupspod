import { YoutubeTranscript } from 'youtube-transcript';

/**
 * Fetch transcript for a YouTube video
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<{content: string, segments: Array}>}
 */
export async function fetchTranscript(videoId) {
  try {
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'en',
    });

    if (!transcriptItems || transcriptItems.length === 0) {
      throw new Error('No transcript available for this video');
    }

    // Convert to our format with timestamps
    const segments = transcriptItems.map((item) => ({
      text: item.text,
      start: item.offset / 1000, // Convert to seconds
      duration: item.duration / 1000,
    }));

    // Combine all text for full-text search
    const content = segments.map((s) => s.text).join(' ');

    return {
      content,
      segments,
    };
  } catch (error) {
    // Try without language specification as fallback
    if (error.message?.includes('lang')) {
      try {
        const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
        const segments = transcriptItems.map((item) => ({
          text: item.text,
          start: item.offset / 1000,
          duration: item.duration / 1000,
        }));
        const content = segments.map((s) => s.text).join(' ');
        return { content, segments };
      } catch (fallbackError) {
        console.error('Fallback transcript fetch failed:', fallbackError);
        throw fallbackError;
      }
    }
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
