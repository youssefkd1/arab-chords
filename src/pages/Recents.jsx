import { useState } from "react";
import { BookOpen, Clock, Music2, X, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSongs } from "../context/SongsContext.jsx";

function formatRecentTime(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function getTimeKey(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const isSameDay = now.getDate() === date.getDate() && now.getMonth() === date.getMonth() && now.getFullYear() === date.getFullYear();
  if (isSameDay) return "today";

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = yesterday.getDate() === date.getDate() && yesterday.getMonth() === date.getMonth() && yesterday.getFullYear() === date.getFullYear();
  if (isYesterday) return "yesterday";

  return "earlier";
}

export const Recents = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { songs, recents, removeRecent, clearRecents } = useSongs();

  const mappedRecents = recents.map(r => {
    const song = songs.find(s => s.id === r.id);
    if (!song) return null;
    return {
      ...song,
      timeKey: getTimeKey(r.timestamp),
      time: formatRecentTime(r.timestamp),
    };
  }).filter(Boolean);

  const groups = [
    { key: "today", label: t('recents.today'), items: mappedRecents.filter((r) => r.timeKey === "today") },
    { key: "yesterday", label: t('recents.yesterday'), items: mappedRecents.filter((r) => r.timeKey === "yesterday") },
    { key: "earlier", label: t('recents.earlier'), items: mappedRecents.filter((r) => r.timeKey === "earlier") },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
              <Clock size={20} color="#0284c7" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 font-inter">{t('recents.title')}</h2>
          </div>
          <p className="text-gray-500 ml-[52px]">{t('recents.subtitle')}</p>
        </div>
        {mappedRecents.length > 0 && (
          <button
            id="clear-recents-btn"
            onClick={clearRecents}
            className="text-sm text-rose-500 hover:text-rose-600 font-medium transition-colors cursor-pointer"
          >
            {t('recents.clearAll')}
          </button>
        )}
      </div>

      {mappedRecents.length === 0 && (
        <div className="text-center py-24 text-gray-400">
          <Clock size={44} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold">{t('recents.emptyTitle')}</p>
          <p className="text-sm mt-1">{t('recents.emptyDesc')}</p>
        </div>
      )}

      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.key}>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
              {group.label}
            </h3>
            <div className="flex flex-col gap-2">
              {group.items.map((song) => (
                <div
                  key={song.id}
                  id={`recent-card-${song.id}`}
                  onClick={() => navigate(`/songs/${song.slug ?? song.id}`)}
                  className="group flex items-center gap-4 bg-white hover:bg-sky-50/50 border border-gray-100 hover:border-sky-200 rounded-2xl px-4 py-3.5 transition-all duration-200 cursor-pointer shadow-sm"
                >
                  <div className="w-9 h-9 rounded-xl bg-sky-100 group-hover:bg-sky-500 flex items-center justify-center transition-all duration-200 shrink-0">
                    <BookOpen size={15} className="text-sky-500 group-hover:text-white transition-colors duration-200" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate text-sm">{song.title}</p>
                    <p className="text-xs text-gray-500 truncate">{song.artist}</p>
                  </div>

                  <span className="hidden sm:block px-2 py-0.5 rounded-lg bg-[#5F7D66]/10 text-[#4F6755] text-xs font-bold shrink-0">
                    {song.key}
                  </span>

                  <span className="text-xs text-gray-400 shrink-0 hidden md:block">{song.time}</span>

                  <button
                    id={`remove-recent-${song.id}`}
                    onClick={(e) => { e.stopPropagation(); removeRecent(song.id); }}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer hover:scale-110"
                    aria-label={t('recents.removeLabel')}
                  >
                    <X size={16} color="#9ca3af" />
                  </button>

                  <ChevronRight size={14} color="#d1d5db" className="shrink-0 group-hover:hidden transition-all" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {mappedRecents.length > 0 && (
        <div className="mt-8 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
          <Music2 size={13} />
          <span>{t('recents.tip', { count: mappedRecents.length })}</span>
        </div>
      )}
    </div>
  );
};

export default Recents;
