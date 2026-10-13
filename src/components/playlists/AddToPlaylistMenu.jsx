import { useRef, useEffect } from "react";
import { ListPlus, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePlaylists } from "../../context/PlaylistsContext.jsx";
import PlaylistCover from "./PlaylistCover.jsx";

export default function AddToPlaylistMenu({ songId, open, onToggle }) {
  const { t } = useTranslation();
  const { playlists, toggleSongInPlaylist, isSongInPlaylist } = usePlaylists();
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onToggle(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onToggle]);

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(!open);
        }}
        className="transition-all duration-200 hover:scale-110 cursor-pointer text-gray-400 hover:text-[#4F6755]"
        aria-label={t("playlists.addToPlaylist")}
      >
        <ListPlus size={17} />
      </button>

      {open && (
        <div className="absolute right-0 top-8 bg-white border border-gray-100 shadow-lg rounded-xl z-30 py-1 min-w-[200px] max-h-56 overflow-y-auto">
          <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {t("playlists.addToPlaylist")}
          </p>
          {playlists.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-400">{t("playlists.noPlaylists")}</p>
          ) : (
            playlists.map((pl) => {
              const inPlaylist = isSongInPlaylist(pl.id, songId);
              return (
                <button
                  key={pl.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSongInPlaylist(pl.id, songId);
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-[#5F7D66]/5 transition-all cursor-pointer"
                >
                  <PlaylistCover color={pl.color} imageUrl={pl.imageUrl} readOnly size="sm" />
                  <span className="flex-1 truncate text-left">{pl.name}</span>
                  {inPlaylist && <Check size={14} color="#4F6755" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
