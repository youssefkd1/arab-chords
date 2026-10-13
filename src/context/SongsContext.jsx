import { createContext, useContext, useMemo, useState, useCallback } from "react";
import { SAMPLE_SONGS } from "../data/songs.js";

const SongsContext = createContext(null);

export function SongsProvider({ children }) {
  // Load initial likes from localStorage
  const initialSongs = useMemo(() => {
    let savedLikes = [];
    try {
      const stored = localStorage.getItem('arab-chords-likes');
      if (stored) savedLikes = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse likes', e);
    }
    return SAMPLE_SONGS.map(s => ({
      ...s,
      liked: savedLikes.includes(s.id)
    }));
  }, []);

  const [songs, setSongs] = useState(initialSongs);
  
  // Load initial recents from localStorage
  const [recents, setRecents] = useState(() => {
    try {
      const stored = localStorage.getItem('arab-chords-recents');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse recents', e);
    }
    return [];
  });

  const toggleLike = useCallback((id) => {
    setSongs((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, liked: !s.liked } : s));
      const likedIds = next.filter(s => s.liked).map(s => s.id);
      localStorage.setItem('arab-chords-likes', JSON.stringify(likedIds));
      return next;
    });
  }, []);

  const addRecent = useCallback((id) => {
    setRecents(prev => {
      const filtered = prev.filter(r => r.id !== id);
      const next = [{ id, timestamp: Date.now() }, ...filtered].slice(0, 30);
      localStorage.setItem('arab-chords-recents', JSON.stringify(next));
      return next;
    });
  }, []);

  const removeRecent = useCallback((id) => {
    setRecents(prev => {
      const next = prev.filter(r => r.id !== id);
      localStorage.setItem('arab-chords-recents', JSON.stringify(next));
      return next;
    });
  }, []);

  const clearRecents = useCallback(() => {
    setRecents([]);
    localStorage.removeItem('arab-chords-recents');
  }, []);

  const favorites = useMemo(() => songs.filter((s) => s.liked), [songs]);

  return (
    <SongsContext.Provider value={{ 
      songs, 
      toggleLike, 
      favorites,
      recents,
      addRecent,
      removeRecent,
      clearRecents
    }}>
      {children}
    </SongsContext.Provider>
  );
}

export function useSongs() {
  const ctx = useContext(SongsContext);
  if (!ctx) {
    throw new Error("useSongs must be used within SongsProvider");
  }
  return ctx;
}
