import { useState } from "react";
import { ListMusic, Plus, Music2, MoreHorizontal, Trash2, Pencil, ImageMinus, PlusCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePlaylists } from "../context/PlaylistsContext.jsx";
import { useSongs } from "../context/SongsContext.jsx";
import PlaylistCover from "../components/playlists/PlaylistCover.jsx";

export const Playlists = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { songs } = useSongs();
  const {
    playlists,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    setPlaylistImage,
    addSongToPlaylist,
    removeSongFromPlaylist,
  } = usePlaylists();

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [addingToId, setAddingToId] = useState(null);

  const create = () => {
    if (!newName.trim()) return;
    createPlaylist(newName);
    setNewName("");
    setCreating(false);
  };

  const startRename = (pl) => {
    setRenamingId(pl.id);
    setRenameValue(pl.name);
    setOpenMenu(null);
  };

  const saveRename = (id) => {
    renamePlaylist(id, renameValue);
    setRenamingId(null);
    setRenameValue("");
  };

  const getSongsForPlaylist = (songIds) =>
    songIds.map((id) => songs.find((s) => s.id === id)).filter(Boolean);

  const availableSongs = (songIds) =>
    songs.filter((s) => !songIds.includes(s.id));

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <ListMusic size={20} color="#d97706" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 font-inter">{t("playlists.title")}</h2>
          </div>
          <p className="text-gray-500 ml-[52px]">{t("playlists.subtitle")}</p>
        </div>
        <button
          id="create-playlist-btn"
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-sm transition-all duration-200 cursor-pointer shadow-sm"
        >
          <Plus size={16} /> {t("playlists.new")}
        </button>
      </div>

      {creating && (
        <div className="bg-white border border-amber-200 rounded-2xl p-4 mb-5 shadow-sm flex gap-3">
          <input
            id="new-playlist-input"
            autoFocus
            type="text"
            placeholder={t("playlists.namePlaceholder")}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
          />
          <button
            id="create-playlist-confirm"
            onClick={create}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-sm transition-all cursor-pointer"
          >
            {t("playlists.create")}
          </button>
          <button
            onClick={() => { setCreating(false); setNewName(""); }}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium rounded-xl text-sm transition-all cursor-pointer"
          >
            {t("playlists.cancel")}
          </button>
        </div>
      )}

      <p className="text-sm text-gray-400 mb-3">
        {t("playlists.count", { count: playlists.length })}
      </p>

      <div className="flex flex-col gap-3">
        {playlists.map((pl) => {
          const playlistSongs = getSongsForPlaylist(pl.songIds);
          const isExpanded = expanded === pl.id;

          return (
            <div
              key={pl.id}
              id={`playlist-card-${pl.id}`}
              className={`relative bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 ${openMenu === pl.id ? "overflow-visible z-30" : "overflow-hidden"}`}
            >
              <div
                className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={() => setExpanded(isExpanded ? null : pl.id)}
              >
                <PlaylistCover
                  color={pl.color}
                  imageUrl={pl.imageUrl}
                  onImageChange={(url) => setPlaylistImage(pl.id, url)}
                />

                <div className="flex-1 min-w-0">
                  {renamingId === pl.id ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        autoFocus
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveRename(pl.id);
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        className="flex-1 px-2 py-1 rounded-lg border border-amber-300 text-sm outline-none focus:ring-2 focus:ring-amber-100"
                      />
                      <button
                        onClick={() => saveRename(pl.id)}
                        className="px-2 py-1 text-xs font-semibold text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer"
                      >
                        {t("playlists.save")}
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="font-bold text-gray-800 truncate">{pl.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {t("playlists.songsCount", { count: pl.songIds.length })}
                      </p>
                    </>
                  )}
                </div>

                <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    id={`playlist-menu-${pl.id}`}
                    onClick={() => setOpenMenu(openMenu === pl.id ? null : pl.id)}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <MoreHorizontal size={16} color="#6b7280" />
                  </button>
                  {openMenu === pl.id && (
                    <div className="absolute right-0 top-10 bg-white border border-gray-100 shadow-lg rounded-xl z-20 py-1 min-w-[160px]">
                      <button
                        onClick={() => startRename(pl)}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
                      >
                        <Pencil size={14} /> {t("playlists.rename")}
                      </button>
                      {pl.imageUrl && (
                        <button
                          onClick={() => { setPlaylistImage(pl.id, null); setOpenMenu(null); }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
                        >
                          <ImageMinus size={14} /> {t("playlists.removeCover")}
                        </button>
                      )}
                      <button
                        id={`playlist-delete-${pl.id}`}
                        onClick={() => { deletePlaylist(pl.id); setOpenMenu(null); }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                      >
                        <Trash2 size={14} /> {t("playlists.delete")}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                  {playlistSongs.length === 0 ? (
                    <p className="text-sm text-gray-400 mb-3">{t("playlists.emptySongs")}</p>
                  ) : (
                    <div className="flex flex-col gap-2 mb-3">
                      {playlistSongs.map((song) => (
                        <div
                          key={song.id}
                          onClick={() => navigate(`/songs/${song.slug ?? song.id}`)}
                          className="group flex items-center gap-3 text-sm text-gray-600 bg-gray-50 hover:bg-[#5F7D66]/5 rounded-xl px-3 py-2 cursor-pointer transition-all duration-200"
                        >
                          <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center shrink-0">
                            <Music2 size={12} color="#9ca3af" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">{song.title}</p>
                            <p className="text-xs text-gray-500 truncate">{song.artist}</p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeSongFromPlaylist(pl.id, song.id); }}
                            className="opacity-0 group-hover:opacity-100 shrink-0 p-1 hover:bg-rose-100 rounded-lg transition-all cursor-pointer"
                            aria-label={t("playlists.removeSong")}
                          >
                            <X size={14} color="#f43f5e" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {addingToId === pl.id ? (
                    <div className="border border-gray-200 rounded-xl p-3 bg-gray-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {t("playlists.addSongs")}
                        </p>
                        <button
                          onClick={() => setAddingToId(null)}
                          className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          {t("playlists.cancel")}
                        </button>
                      </div>
                      {availableSongs(pl.songIds).length === 0 ? (
                        <p className="text-sm text-gray-400">{t("playlists.allSongsAdded")}</p>
                      ) : (
                        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                          {availableSongs(pl.songIds).map((song) => (
                            <button
                              key={song.id}
                              onClick={() => addSongToPlaylist(pl.id, song.id)}
                              className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm text-left hover:bg-white transition-all cursor-pointer"
                            >
                              <PlusCircle size={14} color="#4F6755" />
                              <span className="truncate">{song.title}</span>
                              <span className="text-xs text-gray-400 truncate">— {song.artist}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingToId(pl.id)}
                      className="flex items-center gap-2 text-sm font-medium text-[#4F6755] hover:text-[#3d5c45] transition-colors cursor-pointer"
                    >
                      <PlusCircle size={16} /> {t("playlists.addSongs")}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {playlists.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <ListMusic size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">{t("playlists.noPlaylists")}</p>
          <p className="text-sm">{t("playlists.noPlaylistsDesc")}</p>
        </div>
      )}
    </div>
  );
};

export default Playlists;
