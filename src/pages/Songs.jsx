import { useState } from "react";
import { BookOpen, Heart, Music, Search, SlidersHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSongs } from "../context/SongsContext.jsx";
import AddToPlaylistMenu from "../components/playlists/AddToPlaylistMenu.jsx";

const DIFFICULTY_COLORS = {
  Beginner: { bg: "bg-emerald-100", text: "text-emerald-700" },
  Intermediate: { bg: "bg-amber-100", text: "text-amber-700" },
  Advanced: { bg: "bg-rose-100", text: "text-rose-700" },
};
const ARTISTS = ["All", "Fairouz", "Abdel Halim Hafez", "Majida El Roumi", "Marcel Khalife", "Nancy Ajram", "Amr Diab", "Elissa", "Kadim Al Saher", "Fares Karam", "Wael Kfoury", "Asala"];
const DIFFICULTY_KEYS = ["All", "Beginner", "Intermediate", "Advanced"];

export const Songs = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { songs, toggleLike } = useSongs();
  const [search, setSearch] = useState("");
  const [selectedArtist, setSelectedArtist] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [openPlaylistMenu, setOpenPlaylistMenu] = useState(null);

  const filtered = songs.filter((song) => {
    const matchSearch =
      song.title.toLowerCase().includes(search.toLowerCase()) ||
      song.artist.toLowerCase().includes(search.toLowerCase());
    const matchArtist =
      selectedArtist === "All" || song.artist === selectedArtist;
    const matchDiff =
      selectedDifficulty === "All" ||
      song.difficulty === selectedDifficulty;

    return matchSearch && matchArtist && matchDiff;
  });

  const diffLabel = (d) => {
    const map = { All: t('common.all'), Beginner: t('common.beginner'), Intermediate: t('common.intermediate'), Advanced: t('common.advanced') };
    return map[d] ?? d;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[#5F7D66]/15 flex items-center justify-center">
            <Music size={20} color="#4F6755" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 font-inter">{t('songs.title')}</h2>
        </div>
        <p className="text-gray-500 ml-[52px]">{t('songs.subtitle')}</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="songs-search"
            type="text"
            placeholder={t('songs.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-[#5F7D66] focus:ring-2 focus:ring-[#5F7D66]/20 transition-all duration-200"
          />
        </div>
        <button
          id="songs-filter-toggle"
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer ${showFilters
              ? "bg-[#5F7D66]/10 border-[#5F7D66]/40 text-[#4F6755]"
              : "bg-white border-gray-200 text-gray-600 hover:border-[#5F7D66]/40 hover:text-[#4F6755]"
            }`}
        >
          <SlidersHorizontal size={15} />
          {t('common.filters')}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5 flex flex-wrap gap-6 shadow-sm">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {t('songs.artist')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ARTISTS.map((a) => (
                <button
                  key={a}
                  id={`artist-filter-${a}`}
                  onClick={() => setSelectedArtist(a)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${selectedArtist === a
                      ? "bg-[#5F7D66] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-[#5F7D66]/10 hover:text-[#4F6755]"
                    }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {t('songs.difficulty')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DIFFICULTY_KEYS.map((d) => (
                <button
                  key={d}
                  id={`difficulty-filter-${d}`}
                  onClick={() => setSelectedDifficulty(d)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${selectedDifficulty === d
                      ? "bg-[#5F7D66] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-[#5F7D66]/10 hover:text-[#4F6755]"
                    }`}
                >
                  {diffLabel(d)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-gray-400 mb-3">
        {t('songs.found', { count: filtered.length })}
      </p>

      {/* Song List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Music size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">{t('songs.noSongsTitle')}</p>
          <p className="text-sm">{t('songs.noSongsDesc')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((song) => {
            const diff = DIFFICULTY_COLORS[song.difficulty];
            return (
              <div
                key={song.id}
                id={`song-card-${song.id}`}
                onClick={() => navigate(`/songs/${song.slug ?? song.id}`)}
                className="group flex items-center gap-4 bg-white hover:bg-[#5F7D66]/5 border border-gray-200 hover:border-[#5F7D66]/30 rounded-2xl px-4 py-3.5 transition-all duration-200 cursor-pointer"
              >
                <div
                  className="w-9 h-9 rounded-xl bg-[#5F7D66]/10 group-hover:bg-[#5F7D66] flex items-center justify-center transition-all duration-200 shrink-0"
                  aria-label={t('songs.openChart', { defaultValue: 'Open chart' })}
                >
                  <BookOpen size={15} className="text-[#4F6755] group-hover:text-white transition-all duration-200" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate text-sm">{song.title}</p>
                  <p className="text-xs text-gray-500 truncate">{song.artist}</p>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-gray-400 font-medium">{t('common.key')}</span>
                  <span className="px-2 py-0.5 rounded-lg bg-[#5F7D66]/10 text-[#4F6755] text-xs font-bold">{song.key}</span>
                </div>


                <span className={`hidden md:block px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${diff.bg} ${diff.text}`}>
                  {diffLabel(song.difficulty)}
                </span>

                <AddToPlaylistMenu
                  songId={song.id}
                  open={openPlaylistMenu === song.id}
                  onToggle={(open) => setOpenPlaylistMenu(open ? song.id : null)}
                />

                <button
                  id={`like-song-${song.id}`}
                  onClick={(e) => { e.stopPropagation(); toggleLike(song.id); }}
                  className="shrink-0 transition-all duration-200 hover:scale-110 cursor-pointer"
                  aria-label={song.liked ? t('songs.unlikeSong') : t('songs.likeSong')}
                >
                  <Heart size={17} color={song.liked ? "#e53e3e" : "#c8c8c8"} fill={song.liked ? "#e53e3e" : "none"} className="transition-all duration-200" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Songs;
