import { useState, useMemo } from "react";
import { BookOpen, Music2, Search, SlidersHorizontal, ChevronRight, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSongs } from "../context/SongsContext.jsx";

const DIFFICULTY_COLORS = {
  Beginner: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "#10b981" },
  Intermediate: { bg: "bg-amber-100", text: "text-amber-700", dot: "#f59e0b" },
  Advanced: { bg: "bg-rose-100", text: "text-rose-700", dot: "#f43f5e" },
};

const STYLE_PALETTE = [
  "#314b38", "#5f7d66", "#9a6430", "#b48a4a",
  "#1f766f", "#8f3e43", "#3d5c7a", "#7a4d3d",
  "#4a6b4a", "#6b4a7a",
];

function styleColor(style) {
  let hash = 0;
  for (let i = 0; i < style.length; i++) hash = style.charCodeAt(i) + ((hash << 5) - hash);
  return STYLE_PALETTE[Math.abs(hash) % STYLE_PALETTE.length];
}

function BarPreview({ bar }) {
  if (Array.isArray(bar)) {
    return (
      <div className="grid grid-cols-2 gap-px">
        {bar.slice(0, 4).map((chord, i) => (
          <span
            key={i}
            className="text-[8px] font-mono font-bold text-center py-px px-0.5 bg-white/60 rounded-sm truncate leading-tight"
          >
            {chord || "—"}
          </span>
        ))}
      </div>
    );
  }
  return (
    <span className="text-[9px] font-mono font-bold text-center truncate leading-tight">
      {bar || "—"}
    </span>
  );
}

function ChartCard({ song, onClick }) {
  const diff = DIFFICULTY_COLORS[song.difficulty] ?? DIFFICULTY_COLORS.Beginner;
  const sections = song.charts?.ireal?.sections ?? [];
  const previewBars = sections.flatMap((s) => s.bars).slice(0, 8);
  const color = styleColor(song.maqam ?? song.style ?? "");

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer"
      style={{ borderTopColor: color, borderTopWidth: "3px" }}
    >
      {/* Top strip */}
      <div
        className="px-4 pt-3 pb-2"
        style={{
          background: `linear-gradient(135deg, ${color}18 0%, transparent 60%)`,
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-bold text-gray-900 truncate text-sm leading-tight">{song.title}</p>
            <p className="text-xs text-gray-500 truncate mt-0.5">{song.artist}</p>
          </div>
          <span
            className="shrink-0 rounded-lg px-1.5 py-0.5 text-[10px] font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {song.key}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
            style={{ backgroundColor: color + "cc" }}
          >
            {song.maqam}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${diff.bg} ${diff.text}`}>
            {song.difficulty}
          </span>
        </div>
      </div>

      {/* iReal mini-grid preview */}
      {previewBars.length > 0 && (
        <div className="px-3 py-2 flex-1">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-400 mb-1.5">
            Chart Preview
          </p>
          <div className="grid grid-cols-4 gap-1">
            {previewBars.map((bar, i) => (
              <div
                key={i}
                className="relative flex items-center justify-center min-h-[2rem] rounded-lg border border-gray-200 bg-[#fffdf7] px-1 py-1 overflow-hidden"
              >
                <BarPreview bar={bar} />
              </div>
            ))}
            {previewBars.length < 8 &&
              Array.from({ length: 8 - previewBars.length }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[2rem] rounded-lg border border-dashed border-gray-100 bg-gray-50" />
              ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-100 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-1">
            <Layers size={9} />
            {sections.length} section{sections.length !== 1 ? "s" : ""}
          </span>
          <span>{song.meter}</span>
          <span>{song.tempo} bpm</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-semibold text-[#4F6755] group-hover:text-[#314b38] transition-colors">
          Open <ChevronRight size={10} />
        </div>
      </div>
    </div>
  );
}

const DIFFICULTY_KEYS = ["All", "Beginner", "Intermediate", "Advanced"];
const STYLE_KEYS = ["All", "Jazz bossa nova", "Modern Arabic dance pop", "Sharqi", "Tarab", "Arab pop", "Egyptian shaabi", "Lebanese pop"];

export default function Charts() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { songs } = useSongs();

  const [search, setSearch] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const allStyles = useMemo(() => {
    const styles = [...new Set(songs.map((s) => s.style).filter(Boolean))].sort();
    return ["All", ...styles];
  }, [songs]);

  const [selectedStyle, setSelectedStyle] = useState("All");

  const filtered = useMemo(() =>
    songs.filter((song) => {
      const q = search.toLowerCase();
      const matchSearch =
        song.title.toLowerCase().includes(q) ||
        song.artist.toLowerCase().includes(q) ||
        (song.maqam ?? "").toLowerCase().includes(q) ||
        (song.key ?? "").toLowerCase().includes(q);
      const matchDiff = selectedDifficulty === "All" || song.difficulty === selectedDifficulty;
      const matchStyle = selectedStyle === "All" || song.style === selectedStyle;
      const hasChart = (song.charts?.ireal?.sections ?? []).length > 0;
      return matchSearch && matchDiff && matchStyle && hasChart;
    }),
    [songs, search, selectedDifficulty, selectedStyle]
  );

  const diffLabel = (d) => {
    const map = { All: t("common.all"), Beginner: t("common.beginner"), Intermediate: t("common.intermediate"), Advanced: t("common.advanced") };
    return map[d] ?? d;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[#5F7D66]/15 flex items-center justify-center">
            <BookOpen size={20} color="#4F6755" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 font-inter">
            {t("nav.charts", { defaultValue: "Charts" })}
          </h2>
        </div>
        <p className="text-gray-500 ml-[52px]">
          {t("charts.subtitle", { defaultValue: "iReal-style chord charts for all songs — click any card to open and play." })}
        </p>
      </div>

      {/* Search & Filter bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="charts-search"
            type="text"
            placeholder={t("songs.searchPlaceholder", { defaultValue: "Search by title, artist, maqam…" })}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-[#5F7D66] focus:ring-2 focus:ring-[#5F7D66]/20 transition-all duration-200"
          />
        </div>
        <button
          id="charts-filter-toggle"
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer ${
            showFilters
              ? "bg-[#5F7D66]/10 border-[#5F7D66]/40 text-[#4F6755]"
              : "bg-white border-gray-200 text-gray-600 hover:border-[#5F7D66]/40 hover:text-[#4F6755]"
          }`}
        >
          <SlidersHorizontal size={15} />
          {t("common.filters")}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5 flex flex-wrap gap-6 shadow-sm">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {t("songs.difficulty", { defaultValue: "Difficulty" })}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DIFFICULTY_KEYS.map((d) => (
                <button
                  key={d}
                  id={`charts-difficulty-${d}`}
                  onClick={() => setSelectedDifficulty(d)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                    selectedDifficulty === d
                      ? "bg-[#5F7D66] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-[#5F7D66]/10 hover:text-[#4F6755]"
                  }`}
                >
                  {diffLabel(d)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Style
            </p>
            <div className="flex flex-wrap gap-1.5">
              {allStyles.map((s) => (
                <button
                  key={s}
                  id={`charts-style-${s.replace(/\s+/g, "-")}`}
                  onClick={() => setSelectedStyle(s)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                    selectedStyle === s
                      ? "bg-[#5F7D66] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-[#5F7D66]/10 hover:text-[#4F6755]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-gray-400 mb-4 flex items-center gap-2">
        <Music2 size={13} />
        {filtered.length} chart{filtered.length !== 1 ? "s" : ""} found
      </p>

      {/* Chart grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">{t("common.noResults")}</p>
          <p className="text-sm mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((song) => (
            <ChartCard
              key={song.id}
              song={song}
              onClick={() => navigate(`/songs/${song.slug ?? song.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
