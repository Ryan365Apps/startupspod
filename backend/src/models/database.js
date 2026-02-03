import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../../data');
const dbPath = path.join(dataDir, 'transcripts.db');

let db;

export function getDb() {
  if (!db) {
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function initDatabase() {
  const db = getDb();

  // Create videos table
  db.exec(`
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      thumbnail_url TEXT,
      published_at TEXT,
      duration TEXT,
      view_count INTEGER,
      channel_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create transcripts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transcripts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL,
      segments TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (video_id) REFERENCES videos(id)
    )
  `);

  // Create full-text search virtual table
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS transcripts_fts USING fts5(
      video_id,
      content,
      content='transcripts',
      content_rowid='id'
    )
  `);

  // Triggers to keep FTS in sync
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS transcripts_ai AFTER INSERT ON transcripts BEGIN
      INSERT INTO transcripts_fts(rowid, video_id, content) VALUES (new.id, new.video_id, new.content);
    END
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS transcripts_ad AFTER DELETE ON transcripts BEGIN
      INSERT INTO transcripts_fts(transcripts_fts, rowid, video_id, content) VALUES('delete', old.id, old.video_id, old.content);
    END
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS transcripts_au AFTER UPDATE ON transcripts BEGIN
      INSERT INTO transcripts_fts(transcripts_fts, rowid, video_id, content) VALUES('delete', old.id, old.video_id, old.content);
      INSERT INTO transcripts_fts(rowid, video_id, content) VALUES (new.id, new.video_id, new.content);
    END
  `);

  // Create themes/keywords table
  db.exec(`
    CREATE TABLE IF NOT EXISTS themes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id TEXT NOT NULL,
      theme TEXT NOT NULL,
      frequency INTEGER DEFAULT 1,
      FOREIGN KEY (video_id) REFERENCES videos(id)
    )
  `);

  console.log('Database initialized successfully');
}

// Video operations
export function saveVideo(video) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO videos (id, title, description, thumbnail_url, published_at, duration, view_count, channel_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    video.id,
    video.title,
    video.description,
    video.thumbnailUrl,
    video.publishedAt,
    video.duration,
    video.viewCount,
    video.channelId
  );
}

export function getVideos(limit = 50, offset = 0) {
  const db = getDb();
  return db.prepare(`
    SELECT v.*,
           CASE WHEN t.id IS NOT NULL THEN 1 ELSE 0 END as has_transcript
    FROM videos v
    LEFT JOIN transcripts t ON v.id = t.video_id
    ORDER BY v.published_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
}

export function getVideo(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM videos WHERE id = ?').get(id);
}

// Transcript operations
export function saveTranscript(videoId, content, segments) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO transcripts (video_id, content, segments)
    VALUES (?, ?, ?)
  `);
  return stmt.run(videoId, content, JSON.stringify(segments));
}

export function getTranscript(videoId) {
  const db = getDb();
  const result = db.prepare('SELECT * FROM transcripts WHERE video_id = ?').get(videoId);
  if (result && result.segments) {
    result.segments = JSON.parse(result.segments);
  }
  return result;
}

// Search operations
export function searchTranscripts(query, limit = 20) {
  const db = getDb();
  return db.prepare(`
    SELECT
      v.id,
      v.title,
      v.thumbnail_url,
      v.published_at,
      snippet(transcripts_fts, 1, '<mark>', '</mark>', '...', 64) as snippet
    FROM transcripts_fts
    JOIN videos v ON transcripts_fts.video_id = v.id
    WHERE transcripts_fts MATCH ?
    ORDER BY rank
    LIMIT ?
  `).all(query, limit);
}

// Theme operations
export function saveThemes(videoId, themes) {
  const db = getDb();
  const deleteStmt = db.prepare('DELETE FROM themes WHERE video_id = ?');
  const insertStmt = db.prepare('INSERT INTO themes (video_id, theme, frequency) VALUES (?, ?, ?)');

  const transaction = db.transaction((videoId, themes) => {
    deleteStmt.run(videoId);
    for (const [theme, frequency] of Object.entries(themes)) {
      insertStmt.run(videoId, theme, frequency);
    }
  });

  transaction(videoId, themes);
}

export function getThemes(videoId) {
  const db = getDb();
  return db.prepare('SELECT theme, frequency FROM themes WHERE video_id = ? ORDER BY frequency DESC').all(videoId);
}

export function getAllThemes(limit = 50) {
  const db = getDb();
  return db.prepare(`
    SELECT theme, SUM(frequency) as total_frequency, COUNT(DISTINCT video_id) as video_count
    FROM themes
    GROUP BY theme
    ORDER BY total_frequency DESC
    LIMIT ?
  `).all(limit);
}
