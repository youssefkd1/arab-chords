import { BookOpen, Heart, Music2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSongs } from "../context/SongsContext.jsx";

const DIFF_COLORS = {
  Beginner: { bg: "bg-emerald-100", text: "text-emerald-700" },
  Intermediate: { bg: "bg-amber-100", text: "text-amber-700" },
  Advanced: { bg: "bg-rose-100", text: "text-rose-700" },
};

export const Favorites = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { favorites, toggleLike } = useSongs();

  const diffLabel = (d) => {
    const map = { Beginner: t('common.beginner'), Intermediate: t('common.intermediate'), Advanced: t('common.advanced') };
    return map[d] ?? d;
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
            <Heart size={20} color="#e11d48" fill="#e11d48" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 font-inter">{t('favorites.title')}</h2>
        </div>
        <p className="text-gray-500 ml-[52px]">{t('favorites.subtitle')}</p>
      </div>

      <p className="text-sm text-gray-400 mb-3">
        {t('favorites.count', { count: favorites.length })}
      </p>

      {favorites.length === 0 && (
        <div className="text-center py-24 text-gray-400">
          <Heart size={44} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold">{t('favorites.emptyTitle')}</p>
          <p className="text-sm mt-1">{t('favorites.emptyDesc')}</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {favorites.map((song) => {
          const diff = DIFF_COLORS[song.difficulty];
          return (
            <div
              key={song.id}
              id={`fav-card-${song.id}`}
              onClick={() => navigate(`/songs/${song.slug ?? song.id}`)}
              className="group flex items-center gap-4 bg-white hover:bg-rose-50/50 border border-gray-100 hover:border-rose-200 rounded-2xl px-4 py-3.5 transition-all duration-200 cursor-pointer shadow-sm"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-100 group-hover:bg-rose-500 flex items-center justify-center transition-all duration-200 shrink-0">
                <BookOpen size={15} className="text-rose-500 group-hover:text-white transition-colors duration-200" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate text-sm">{song.title}</p>
                <p className="text-xs text-gray-500 truncate">{song.artist}</p>
              </div>

              <span className="hidden sm:block px-2 py-0.5 rounded-lg bg-[#5F7D66]/10 text-[#4F6755] text-xs font-bold shrink-0">
                {song.key}
              </span>



              <span className={`hidden md:block px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${diff.bg} ${diff.text}`}>
                {diffLabel(song.difficulty)}
              </span>

              <button
                id={`remove-fav-${song.id}`}
                onClick={(e) => { e.stopPropagation(); toggleLike(song.id); }}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer hover:scale-110"
                aria-label={t('favorites.removeLabel')}
              >
                <Trash2 size={16} color="#f43f5e" />
              </button>

              <Heart size={16} color="#e11d48" fill="#e11d48" className="shrink-0 group-hover:hidden transition-all" />
            </div>
          );
        })}
      </div>

      {favorites.length > 0 && (
        <div className="mt-8 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
          <Music2 size={13} />
          <span>{t('favorites.tip')}</span>
        </div>
      )}
    </div>
  );
};

export default Favorites;
