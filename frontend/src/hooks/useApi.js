import { useState, useCallback } from 'react';

const API_BASE = '/api';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((endpoint) => request(endpoint), [request]);

  const post = useCallback(
    (endpoint, body) => request(endpoint, { method: 'POST', body }),
    [request]
  );

  return { get, post, loading, error };
}

// Specialized hooks
export function useVideos() {
  const { get, post, loading, error } = useApi();
  const [videos, setVideos] = useState([]);

  const fetchVideos = useCallback(async () => {
    const data = await get('/videos');
    setVideos(data.videos || []);
    return data;
  }, [get]);

  const fetchChannel = useCallback(
    async (channelHandle = '@startupspod', maxResults = 50) => {
      return post('/videos/fetch-channel', { channelHandle, maxResults });
    },
    [post]
  );

  return { videos, fetchVideos, fetchChannel, loading, error };
}

export function useTranscript(videoId) {
  const { get, post, loading, error } = useApi();
  const [transcript, setTranscript] = useState(null);
  const [themes, setThemes] = useState([]);

  const fetchTranscript = useCallback(async () => {
    if (!videoId) return;
    try {
      const data = await get(`/transcripts/${videoId}`);
      setTranscript(data);
      return data;
    } catch (err) {
      if (err.message.includes('404')) {
        setTranscript(null);
      }
      throw err;
    }
  }, [get, videoId]);

  const scrapeTranscript = useCallback(async () => {
    if (!videoId) return;
    const data = await post(`/transcripts/${videoId}/fetch`, {});
    setTranscript(data.transcript);
    setThemes(Object.entries(data.themes || {}).map(([theme, freq]) => ({ theme, frequency: freq })));
    return data;
  }, [post, videoId]);

  const fetchThemes = useCallback(async () => {
    if (!videoId) return;
    const data = await get(`/transcripts/${videoId}/themes`);
    setThemes(data.themes || []);
    return data;
  }, [get, videoId]);

  return { transcript, themes, fetchTranscript, scrapeTranscript, fetchThemes, loading, error };
}

export function useSearch() {
  const { get, loading, error } = useApi();
  const [results, setResults] = useState([]);

  const search = useCallback(
    async (query) => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      const data = await get(`/search?q=${encodeURIComponent(query)}`);
      setResults(data.results || []);
      return data;
    },
    [get]
  );

  return { results, search, loading, error };
}

export function useThemes() {
  const { get, loading, error } = useApi();
  const [themes, setThemes] = useState([]);

  const fetchThemes = useCallback(async () => {
    const data = await get('/search/themes');
    setThemes(data.themes || []);
    return data;
  }, [get]);

  return { themes, fetchThemes, loading, error };
}
