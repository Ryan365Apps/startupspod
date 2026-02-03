import { Router } from 'express';
import { getChannelVideos, getVideoDetails, getChannelByHandle } from '../services/youtube.js';
import { saveVideo, getVideos, getVideo } from '../models/database.js';

const router = Router();

/**
 * GET /api/videos
 * Get all stored videos
 */
router.get('/', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const videos = getVideos(limit, offset);
    res.json({ videos, limit, offset });
  } catch (error) {
    console.error('Error getting videos:', error);
    res.status(500).json({ error: 'Failed to get videos' });
  }
});

/**
 * GET /api/videos/:id
 * Get a specific video
 */
router.get('/:id', (req, res) => {
  try {
    const video = getVideo(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    res.json(video);
  } catch (error) {
    console.error('Error getting video:', error);
    res.status(500).json({ error: 'Failed to get video' });
  }
});

/**
 * POST /api/videos/fetch-channel
 * Fetch videos from a YouTube channel and store them
 */
router.post('/fetch-channel', async (req, res) => {
  try {
    const { channelHandle = '@startupspod', maxResults = 50 } = req.body;

    console.log(`Fetching videos from channel: ${channelHandle}`);

    // Get channel info first
    const channelInfo = await getChannelByHandle(channelHandle);
    console.log(`Found channel: ${channelInfo.name} (${channelInfo.id})`);

    // Fetch videos
    const videos = await getChannelVideos(channelHandle, maxResults);
    console.log(`Fetched ${videos.length} videos`);

    // Save to database
    let saved = 0;
    for (const video of videos) {
      try {
        saveVideo(video);
        saved++;
      } catch (err) {
        console.error(`Error saving video ${video.id}:`, err);
      }
    }

    res.json({
      success: true,
      channel: channelInfo,
      fetched: videos.length,
      saved,
    });
  } catch (error) {
    console.error('Error fetching channel videos:', error);
    res.status(500).json({ error: 'Failed to fetch channel videos', details: error.message });
  }
});

/**
 * POST /api/videos/fetch-single
 * Fetch a single video by ID
 */
router.post('/fetch-single', async (req, res) => {
  try {
    const { videoId } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    const videoDetails = await getVideoDetails(videoId);
    saveVideo(videoDetails);

    res.json({
      success: true,
      video: videoDetails,
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ error: 'Failed to fetch video', details: error.message });
  }
});

export default router;
