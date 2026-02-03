import { Router } from 'express';
import { fetchTranscript, formatTranscriptWithTimestamps } from '../services/transcript.js';
import { extractThemes } from '../services/themes.js';
import {
  saveTranscript,
  getTranscript,
  getVideos,
  saveThemes,
  getThemes,
} from '../models/database.js';

const router = Router();

/**
 * GET /api/transcripts/:videoId
 * Get transcript for a video
 */
router.get('/:videoId', (req, res) => {
  try {
    const transcript = getTranscript(req.params.videoId);
    if (!transcript) {
      return res.status(404).json({ error: 'Transcript not found' });
    }
    res.json(transcript);
  } catch (error) {
    console.error('Error getting transcript:', error);
    res.status(500).json({ error: 'Failed to get transcript' });
  }
});

/**
 * GET /api/transcripts/:videoId/formatted
 * Get formatted transcript with timestamps
 */
router.get('/:videoId/formatted', (req, res) => {
  try {
    const transcript = getTranscript(req.params.videoId);
    if (!transcript) {
      return res.status(404).json({ error: 'Transcript not found' });
    }
    const formatted = formatTranscriptWithTimestamps(transcript.segments);
    res.json({ videoId: req.params.videoId, formatted });
  } catch (error) {
    console.error('Error getting formatted transcript:', error);
    res.status(500).json({ error: 'Failed to get formatted transcript' });
  }
});

/**
 * POST /api/transcripts/:videoId/fetch
 * Fetch and store transcript for a video from YouTube
 */
router.post('/:videoId/fetch', async (req, res) => {
  try {
    const { videoId } = req.params;

    // Check if we already have the transcript
    const existing = getTranscript(videoId);
    if (existing && !req.body.force) {
      return res.json({
        success: true,
        message: 'Transcript already exists',
        transcript: existing,
        cached: true,
      });
    }

    console.log(`Fetching transcript for video: ${videoId}`);

    // Fetch from YouTube
    const { content, segments } = await fetchTranscript(videoId);

    // Save to database
    saveTranscript(videoId, content, segments);

    // Extract and save themes
    const themes = extractThemes(content);
    saveThemes(videoId, themes);

    res.json({
      success: true,
      transcript: { videoId, content, segments },
      themes,
      cached: false,
    });
  } catch (error) {
    console.error('Error fetching transcript:', error);
    res.status(500).json({
      error: 'Failed to fetch transcript',
      details: error.message,
    });
  }
});

/**
 * POST /api/transcripts/fetch-all
 * Fetch transcripts for all videos that don't have one
 */
router.post('/fetch-all', async (req, res) => {
  try {
    const { limit = 10, delay = 2000 } = req.body;

    // Get videos without transcripts
    const videos = getVideos(100, 0).filter((v) => !v.has_transcript);
    const toFetch = videos.slice(0, limit);

    console.log(`Fetching transcripts for ${toFetch.length} videos`);

    const results = {
      success: [],
      failed: [],
    };

    for (const video of toFetch) {
      try {
        console.log(`Fetching transcript for: ${video.title}`);
        const { content, segments } = await fetchTranscript(video.id);
        saveTranscript(video.id, content, segments);

        // Extract and save themes
        const themes = extractThemes(content);
        saveThemes(video.id, themes);

        results.success.push({ id: video.id, title: video.title });

        // Delay to avoid rate limiting
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (error) {
        console.error(`Failed to fetch transcript for ${video.id}:`, error.message);
        results.failed.push({ id: video.id, title: video.title, error: error.message });
      }
    }

    res.json({
      success: true,
      total: toFetch.length,
      succeeded: results.success.length,
      failed: results.failed.length,
      results,
    });
  } catch (error) {
    console.error('Error in batch fetch:', error);
    res.status(500).json({ error: 'Failed to fetch transcripts', details: error.message });
  }
});

/**
 * GET /api/transcripts/:videoId/themes
 * Get themes for a video
 */
router.get('/:videoId/themes', (req, res) => {
  try {
    const themes = getThemes(req.params.videoId);
    res.json({ videoId: req.params.videoId, themes });
  } catch (error) {
    console.error('Error getting themes:', error);
    res.status(500).json({ error: 'Failed to get themes' });
  }
});

export default router;
