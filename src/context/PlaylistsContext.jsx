import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_PLAYLISTS, PLAYLIST_COLORS } from "../data/playlists.js";

const STORAGE_KEY = "arab-chords-playlists";

const PlaylistsContext = createContext(null);

function loadPlaylists() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    /* ignore corrupt storage */
  }
  return DEFAULT_PLAYLISTS;
}

export function PlaylistsProvider({ children }) {
  const [playlists, setPlaylists] = useState(loadPlaylists);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
  }, [playlists]);

  const createPlaylist = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setPlaylists((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: trimmed,
        color: PLAYLIST_COLORS[prev.length % PLAYLIST_COLORS.length],
        imageUrl: null,
        songIds: [],
      },
    ]);
  };

  const deletePlaylist = (id) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
  };

  const renamePlaylist = (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setPlaylists((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: trimmed } : p))
    );
  };

  const setPlaylistImage = (id, imageUrl) => {
    setPlaylists((prev) =>
      prev.map((p) => (p.id === id ? { ...p, imageUrl } : p))
    );
  };

  const addSongToPlaylist = (playlistId, songId) => {
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId && !p.songIds.includes(songId)
          ? { ...p, songIds: [...p.songIds, songId] }
          : p
      )
    );
  };

  const removeSongFromPlaylist = (playlistId, songId) => {
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId
          ? { ...p, songIds: p.songIds.filter((id) => id !== songId) }
          : p
      )
    );
  };

  const toggleSongInPlaylist = (playlistId, songId) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;
    if (playlist.songIds.includes(songId)) {
      removeSongFromPlaylist(playlistId, songId);
    } else {
      addSongToPlaylist(playlistId, songId);
    }
  };

  const isSongInPlaylist = (playlistId, songId) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    return playlist?.songIds.includes(songId) ?? false;
  };

  return (
    <PlaylistsContext.Provider
      value={{
        playlists,
        createPlaylist,
        deletePlaylist,
        renamePlaylist,
        setPlaylistImage,
        addSongToPlaylist,
        removeSongFromPlaylist,
        toggleSongInPlaylist,
        isSongInPlaylist,
      }}
    >
      {children}
    </PlaylistsContext.Provider>
  );
}

export function usePlaylists() {
  const ctx = useContext(PlaylistsContext);
  if (!ctx) {
    throw new Error("usePlaylists must be used within PlaylistsProvider");
  }
  return ctx;
}
