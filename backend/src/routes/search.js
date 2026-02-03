import { Router } from 'express';
import { searchTranscripts, getAllThemes } from '../models/database.js';

const router = Router();

/**
 * GET /api/search
 * Search across all transcripts
 */
router.get('/', (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Prepare query for FTS5
    // Support phrases in quotes, otherwise treat as OR search
    let searchQuery = q.trim();
    if (!searchQuery.includes('"')) {
      // Convert to OR search: "word1 word2" -> "word1 OR word2"
      searchQuery = searchQuery.split(/\s+/).join(' OR ');
    }

    const results = searchTranscripts(searchQuery, parseInt(limit));

    res.json({
      query: q,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

/**
 * GET /api/search/themes
 * Get all themes across all videos
 */
router.get('/themes', (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const themes = getAllThemes(parseInt(limit));
    res.json({ themes });
  } catch (error) {
    console.error('Error getting themes:', error);
    res.status(500).json({ error: 'Failed to get themes' });
  }
});

export default router;
