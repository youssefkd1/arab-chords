import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Columns3,
  Gauge,
  Heart,
  Loader2,
  Music2,
  Pause,
  Play,
  ScrollText,
  Timer,
  Volume2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSongs } from "../context/SongsContext.jsx";
import { playChart, stopChart, setPlaybackTempo, setInstrumentVolume } from "../utils/audio.js";

// ─── Constants ──────────────────────────────────────────────────────────────
const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const ALIASES = {
  Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#",
  Cb: "B", Fb: "E", "B#": "C", "E#": "F",
};

function transposeChordText(text, steps) {
  if (!text || steps === 0) return text;
  return text.replace(/(^|[\s/()|])([A-G][b#]?)/g, (match, prefix, root) => {
    let normalized = ALIASES[root] || root;
    let index = NOTES.indexOf(normalized);
    if (index === -1) return match;
    let newIndex = (index + steps) % 12;
    if (newIndex < 0) newIndex += 12;
    return prefix + NOTES[newIndex];
  });
}

function getLocalizedLyrics(lyrics, language) {
  const baseLanguage = language?.split("-")[0] ?? "en";
  const locales = lyrics?.locales;
  if (locales) {
    const localized = locales[baseLanguage] ?? locales.en ?? Object.values(locales)[0];
    return {
      lang: locales[baseLanguage] ? baseLanguage : "en",
      sections: localized?.sections ?? [],
    };
  }
  return { lang: "en", sections: lyrics?.sections ?? [] };
}

function getBarChords(bar) {
  if (Array.isArray(bar)) {
    return bar.slice(0, 4);
  }
  if (typeof bar === "string" && bar.trim().length > 0) {
    return [bar];
  }
  return [];
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function SongMeta({ icon: Icon, label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
      <Icon size={15} className="text-[#4F6755]" />
      <span className="text-xs font-medium text-gray-400">{label}</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  );
}

function LyricsMode({ sections, lang, transpose }) {
  const isRtl = lang === "ar";
  return (
    <div className="space-y-5" dir={isRtl ? "rtl" : "ltr"}>
      {sections.map((section) => (
        <section
          key={section.name}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-4 flex items-center gap-2">
            <div className="h-6 w-1 rounded-full bg-[#5F7D66]" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
              {section.name}
            </h2>
          </div>
          <div className="space-y-4">
            {section.lines.map((line, lineIndex) => (
              <div
                key={`${section.name}-${lineIndex}`}
                className={`flex flex-wrap items-end gap-x-1 gap-y-3 border-b border-dashed border-gray-100 pb-3 last:border-b-0 last:pb-0 ${isRtl ? "text-right" : "text-left"
                  }`}
              >
                {line.segments.map((segment, segmentIndex) => (
                  <span
                    key={`${section.name}-${lineIndex}-${segmentIndex}`}
                    className="inline-flex min-w-[3.75rem] flex-col"
                  >
                    <span className="mb-1 font-mono text-sm font-bold text-[#4F6755]">
                      {transposeChordText(segment.chord, transpose) || "\u00a0"}
                    </span>
                    <span className="text-lg leading-8 text-gray-800">
                      {segment.text}
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function IrealMode({ sections, transpose, activeSection, activeBar }) {
  return (
    <div className="space-y-5">
      {sections.map((section, sIdx) => (
        <section
          key={section.name}
          className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5F7D66]/10 text-sm font-bold text-[#4F6755]">
                {section.name.slice(0, 1)}
              </div>
              <h2 className="font-bold text-gray-800">{section.name}</h2>
            </div>
            {section.repeat > 1 && (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
                x{section.repeat}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {section.bars.map((bar, bIdx) => {
              const isActive = activeSection === sIdx && activeBar === bIdx;
              const barChords = getBarChords(bar);
              const isMultiChord = barChords.length > 1;

              return (
                <div
                  key={`${section.name}-${bIdx}`}
                  className={`relative min-h-20 rounded-xl border-2 px-3 py-3 transition-all duration-200 ${isActive
                      ? "border-[#5F7D66] bg-[#5F7D66]/10 shadow-lg shadow-[#5F7D66]/20 scale-[1.03]"
                      : "border-gray-800/70 bg-[#fffdf7] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.03)]"
                    }`}
                >
                  <span className="absolute left-2 top-1 text-[10px] font-semibold text-gray-300">
                    {bIdx + 1}
                  </span>
                  {isActive && (
                    <span className="absolute right-2 top-1.5">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-[#5F7D66] animate-pulse" />
                    </span>
                  )}

                  {isMultiChord ? (
                    <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
                      {barChords.map((chord, chordIdx) => (
                        <span
                          key={`${section.name}-${bIdx}-${chordIdx}`}
                          className="rounded-2xl bg-white/90 px-2 py-2 text-center text-xs font-semibold uppercase tracking-[0.06em] text-gray-800 shadow-sm"
                        >
                          {transposeChordText(chord || "", transpose) || "\u00a0"}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div
                      className={`flex h-full items-center justify-center text-center font-mono text-xl font-bold ${isActive ? "text-[#314b38]" : "text-gray-900"
                        }`}
                    >
                      {transposeChordText(barChords[0] || "", transpose) || "\u00a0"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

// ─── Play Button ─────────────────────────────────────────────────────────────
function PlayButton({ isPlaying, isLoading, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[#314b38] text-sm font-bold shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      aria-label={isPlaying ? "Stop playback" : "Play chart"}
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : isPlaying ? (
        <Pause size={16} />
      ) : (
        <Play size={16} />
      )}
      <span>{isLoading ? "Loading…" : isPlaying ? "Stop" : "Play"}</span>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SongChart() {
  const { songId } = useParams();
  const { t, i18n } = useTranslation();
  const { songs, toggleLike, addRecent } = useSongs();

  const song = useMemo(
    () =>
      songs.find(
        (candidate) =>
          String(candidate.id) === songId || candidate.slug === songId
      ),
    [songId, songs]
  );

  const [mode, setMode] = useState("lyrics");
  const [transpose, setTranspose] = useState(0);
  const [tempo, setTempo] = useState(80);
  const [drumsVolume, setDrumsVolume] = useState(0);
  const [pianoVolume, setPianoVolume] = useState(0);
  const [bassVolume, setBassVolume] = useState(0);
  const [maqsoumVariation, setMaqsoumVariation] = useState("none");
  const [practiceRepeats, setPracticeRepeats] = useState(1);
  const [practiceTempoStep, setPracticeTempoStep] = useState(0);
  const [practiceMaxTempo, setPracticeMaxTempo] = useState(180);
  const [currentRepeat, setCurrentRepeat] = useState(1);
  const [isMixerOpen, setIsMixerOpen] = useState(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState(-1);
  const [activeBar, setActiveBar] = useState(-1);
  const transposeRef = useRef(transpose);
  const tempoRef = useRef(tempo);

  useEffect(() => {
    transposeRef.current = transpose;
  }, [transpose]);

  useEffect(() => {
    tempoRef.current = tempo;
  }, [tempo]);

  useEffect(() => {
    if (song) addRecent(song.id);
  }, [song?.id, addRecent]);

  // Reset tempo to the song's default whenever the song changes
  useEffect(() => {
    setTempo(song?.tempo ?? 80);
  }, [song?.id]);

  // Stop audio on unmount or song change
  useEffect(() => {
    return () => {
      stopChart();
      setIsPlaying(false);
      setActiveSection(-1);
      setActiveBar(-1);
      setCurrentRepeat(1);
    };
  }, [songId]);

  const handleBarChange = useCallback((sIdx, bIdx) => {
    if (sIdx === -1) {
      setIsPlaying(false);
      setActiveSection(-1);
      setActiveBar(-1);
      setCurrentRepeat(1);
    } else {
      setActiveSection(sIdx);
      setActiveBar(bIdx);
    }
  }, []);

  const handlePlayStop = useCallback(async () => {
    if (isPlaying) {
      stopChart();
      setIsPlaying(false);
      setActiveSection(-1);
      setActiveBar(-1);
      setCurrentRepeat(1);
      return;
    }

    if (!song) return;
    const irealSections = song.charts?.ireal?.sections ?? [];
    if (irealSections.length === 0) return;

    setIsLoading(true);
    setCurrentRepeat(1);
    try {
      await playChart({
        sections: irealSections,
        tempo: tempoRef.current,
        transpose: transposeRef.current,
        rhythm: maqsoumVariation,
        practice: {
          repeats: practiceRepeats,
          tempoStep: practiceTempoStep,
          maxTempo: practiceMaxTempo,
        },
        onBarChange: handleBarChange,
        onRepeatChange: (repeatIndex, bpm) => {
          setCurrentRepeat(repeatIndex + 1);
          setTempo(bpm);
          tempoRef.current = bpm;
        },
      });
      setIsPlaying(true);
      // Switch to iReal mode to see the highlights
      setMode("ireal");
    } catch (err) {
      console.error("Playback failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isPlaying, song, handleBarChange, maqsoumVariation, practiceRepeats, practiceTempoStep, practiceMaxTempo]);

  if (!song) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Link
          to="/songs"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#4F6755]"
        >
          <ArrowLeft size={16} />
          {t("chart.backToSongs", { defaultValue: "Back to songs" })}
        </Link>
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          {t("chart.notFound", { defaultValue: "Song chart not found." })}
        </div>
      </div>
    );
  }

  const localizedLyrics = getLocalizedLyrics(
    song.charts?.lyrics,
    i18n.resolvedLanguage ?? i18n.language
  );
  const irealSections = song.charts?.ireal?.sections ?? [];

  return (
    <div className="mx-auto max-w-5xl p-6">
      <Link
        to="/songs"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#4F6755] hover:text-[#3d5c45]"
      >
        <ArrowLeft size={16} />
        {t("chart.backToSongs", { defaultValue: "Back to songs" })}
      </Link>

      <header className="sharqi-panel relative mb-6 overflow-hidden rounded-3xl p-6 text-white shadow-xl">
        <div className="absolute inset-0 opacity-[0.16] pointer-events-none bg-[linear-gradient(135deg,_transparent_0_38%,_rgba(255,255,255,0.22)_38%_40%,_transparent_40%_58%,_rgba(255,255,255,0.16)_58%_60%,_transparent_60%)] bg-[length:28px_28px]" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="mb-1 font-ibm-plex text-xl font-semibold text-[#f6d38f]">
              {song.maqam}
            </p>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/75">
              <BookOpen size={16} />
              <span>{t("chart.songChart", { defaultValue: "Song chart" })}</span>
            </div>
            <h1 className="text-3xl font-bold leading-tight md:text-4xl">
              {song.title}
            </h1>
            <p className="mt-2 text-white/75">{song.artist}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <PlayButton
              isPlaying={isPlaying}
              isLoading={isLoading}
              onClick={handlePlayStop}
            />
            <button
              type="button"
              onClick={() => toggleLike(song.id)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white transition-all hover:bg-white/25"
              aria-label={song.liked ? t("songs.unlikeSong") : t("songs.likeSong")}
            >
              <Heart size={20} fill={song.liked ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        <div className="relative mt-5 flex flex-wrap gap-2">
          <span className="rounded-xl bg-[#fffaf0] px-3 py-1.5 text-sm font-bold text-[#244a41] flex items-center gap-2">
            {t("common.key")} {transposeChordText(song.key, transpose)}
          </span>
          <div className="flex items-center gap-1 rounded-xl bg-[#244a41]/35 p-1 text-white">
            <button
              onClick={() => {
                if (isPlaying) { stopChart(); setIsPlaying(false); setActiveSection(-1); setActiveBar(-1); }
                setTranspose((v) => v - 1);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/20 font-bold transition-colors cursor-pointer"
              aria-label="Transpose down"
            >
              -
            </button>
            <span className="min-w-[2.5rem] text-center text-sm font-semibold">
              {transpose > 0 ? `+${transpose}` : transpose}
            </span>
            <button
              onClick={() => {
                if (isPlaying) { stopChart(); setIsPlaying(false); setActiveSection(-1); setActiveBar(-1); }
                setTranspose((v) => v + 1);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/20 font-bold transition-colors cursor-pointer"
              aria-label="Transpose up"
            >
              +
            </button>
          </div>

          {/* Tempo control — live adjustable while playing */}
          <div className="flex items-center gap-2 rounded-xl bg-[#244a41]/35 p-1 pr-3 text-white">
            <Gauge size={14} className="ml-1 opacity-70" />
            <input
              type="range"
              min={50}
              max={200}
              step={1}
              value={tempo}
              onChange={(e) => {
                const next = Number(e.target.value);
                setTempo(next);
                if (isPlaying) setPlaybackTempo(next);
              }}
              className="w-24 accent-white cursor-pointer"
              aria-label="Tempo"
            />
            <span className="min-w-[3.25rem] text-center text-sm font-semibold">
              {tempo} bpm
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-[#244a41]/35 p-1 text-white">
            {[
              { value: "none", label: "Off" },
              { value: "maqsoum1", label: "Maqsoum 1" },
              { value: "maqsoum2", label: "Maqsoum 2" },
              { value: "bossa", label: "Bossa Nova" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  if (isPlaying) { stopChart(); setIsPlaying(false); setActiveSection(-1); setActiveBar(-1); }
                  setMaqsoumVariation(option.value);
                }}
                className={`rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${maqsoumVariation === option.value
                    ? "bg-[#f6d38f] text-[#244a41]"
                    : "text-white/80 hover:bg-white/15"
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsMixerOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-[#f6d38f]/35 bg-[#9a6430]/35 px-3 py-2 text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#9a6430]/50"
          >
            <div className="rounded-lg bg-white/15 p-1">
              <Volume2 size={14} className="opacity-90" />
            </div>
            <span className="text-sm font-semibold">Mixer</span>
          </button>

          <span className="rounded-xl bg-[#1f766f]/35 px-3 py-1.5 text-sm font-semibold text-white">
            {song.style}
          </span>
          <span className="rounded-xl bg-[#8f3e43]/35 px-3 py-1.5 text-sm font-semibold text-white">
            {song.maqam}
          </span>
        </div>
      </header>

      <section className="mb-6 rounded-2xl border border-[#dfe8de] bg-white/90 p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold text-[#314b38]">Practice tools</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Repeat {currentRepeat} / {practiceRepeats}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[36rem]">
            <label className="flex items-center justify-between gap-3 rounded-xl bg-[#f6f8f4] px-3 py-2 text-sm">
              <span className="font-semibold text-gray-600">Repeats</span>
              <input
                type="number"
                min={1}
                max={12}
                value={practiceRepeats}
                onChange={(e) => {
                  if (isPlaying) { stopChart(); setIsPlaying(false); setActiveSection(-1); setActiveBar(-1); setCurrentRepeat(1); }
                  setPracticeRepeats(Math.min(12, Math.max(1, Number(e.target.value) || 1)));
                }}
                className="h-9 w-16 rounded-lg border border-[#dfe8de] bg-white px-2 text-center font-bold text-[#314b38]"
                aria-label="Practice repeats"
              />
            </label>

            <label className="flex items-center justify-between gap-3 rounded-xl bg-[#f6f8f4] px-3 py-2 text-sm">
              <span className="font-semibold text-gray-600">BPM +</span>
              <input
                type="number"
                min={0}
                max={20}
                value={practiceTempoStep}
                onChange={(e) => {
                  if (isPlaying) { stopChart(); setIsPlaying(false); setActiveSection(-1); setActiveBar(-1); setCurrentRepeat(1); }
                  setPracticeTempoStep(Math.min(20, Math.max(0, Number(e.target.value) || 0)));
                }}
                className="h-9 w-16 rounded-lg border border-[#dfe8de] bg-white px-2 text-center font-bold text-[#314b38]"
                aria-label="Tempo increase per repeat"
              />
            </label>

            <label className="flex items-center justify-between gap-3 rounded-xl bg-[#f6f8f4] px-3 py-2 text-sm">
              <span className="font-semibold text-gray-600">Max BPM</span>
              <input
                type="number"
                min={50}
                max={220}
                value={practiceMaxTempo}
                onChange={(e) => {
                  if (isPlaying) { stopChart(); setIsPlaying(false); setActiveSection(-1); setActiveBar(-1); setCurrentRepeat(1); }
                  setPracticeMaxTempo(Math.min(220, Math.max(50, Number(e.target.value) || 180)));
                }}
                className="h-9 w-20 rounded-lg border border-[#dfe8de] bg-white px-2 text-center font-bold text-[#314b38]"
                aria-label="Maximum practice tempo"
              />
            </label>
          </div>
        </div>
      </section>

      {isMixerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#314b38]/75 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/30 bg-[linear-gradient(145deg,_#fdfefc_0%,_#edf5ea_100%)] shadow-[0_25px_70px_rgba(49,75,56,0.32)]">
            <div className="border-b border-[#dfe8de] bg-gradient-to-r from-[#314b38] to-[#5f7d66] px-6 py-5 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">Instrument mixer</p>
                  <h3 className="text-2xl font-bold">Shape your sound</h3>
                  <p className="mt-1 text-sm text-white/75">Fine-tune the groove, chords, and bass in one place.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMixerOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-xl font-semibold text-white transition-all hover:scale-105 hover:bg-white/25"
                  aria-label="Close mixer"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-3">
              {[
                { key: "drums", label: "Drums", value: drumsVolume, min: -18, max: 6, accent: "from-[#7f8f71] to-[#4f6755]", description: "Rhythm layer", setValue: setDrumsVolume, onChange: (v) => setInstrumentVolume("drums", v) },
                { key: "piano", label: "Piano", value: pianoVolume, min: -24, max: 6, accent: "from-[#b08b4f] to-[#8e6c32]", description: "Chord layer", setValue: setPianoVolume, onChange: (v) => setInstrumentVolume("piano", v) },
                { key: "bass", label: "Bass", value: bassVolume, min: -24, max: 6, accent: "from-[#3f5f4d] to-[#2a4334]", description: "Low-end layer", setValue: setBassVolume, onChange: (v) => setInstrumentVolume("bass", v) },
              ].map((control) => (
                <div key={control.key} className="rounded-[24px] border border-[#dfe8de] bg-white/85 p-4 shadow-[0_10px_30px_rgba(49,75,56,0.08)]">
                  <div className={`mb-4 rounded-2xl bg-gradient-to-r ${control.accent} px-3 py-2 text-white`}>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{control.label}</p>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">{control.description}</p>
                      </div>
                      <div className="rounded-full bg-white/20 px-2.5 py-1 text-sm font-bold">
                        {control.value}dB
                      </div>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={control.min}
                    max={control.max}
                    step={1}
                    value={control.value}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      control.setValue(next);
                      control.onChange(next);
                    }}
                    className="h-2.5 w-full cursor-pointer appearance-none rounded-full bg-[#e7efe6] accent-[#5F7D66]"
                    aria-label={`${control.label} volume`}
                  />

                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>{control.min}dB</span>
                    <span>{control.max}dB</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <SongMeta icon={Music2} label={t("chart.meter", { defaultValue: "Meter" })} value={song.meter} />
        <SongMeta icon={Timer} label={t("chart.tempo", { defaultValue: "Tempo" })} value={`${tempo} bpm`} />
        <SongMeta icon={Gauge} label={t("songs.difficulty")} value={t(`common.${song.difficulty.toLowerCase()}`, { defaultValue: song.difficulty })} />
      </div>

      <div className="mb-5 flex rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setMode("lyrics")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${mode === "lyrics"
              ? "bg-[#5F7D66] text-white shadow-sm"
              : "text-gray-500 hover:bg-gray-50"
            }`}
        >
          <ScrollText size={16} />
          {t("chart.lyricsMode", { defaultValue: "Lyrics mode" })}
        </button>
        <button
          type="button"
          onClick={() => setMode("ireal")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${mode === "ireal"
              ? "bg-[#5F7D66] text-white shadow-sm"
              : "text-gray-500 hover:bg-gray-50"
            }`}
        >
          <Columns3 size={16} />
          {t("chart.irealMode", { defaultValue: "iReal mode" })}
        </button>
      </div>

      {mode === "lyrics" ? (
        <LyricsMode
          sections={localizedLyrics.sections}
          lang={localizedLyrics.lang}
          transpose={transpose}
        />
      ) : (
        <IrealMode
          sections={irealSections}
          transpose={transpose}
          activeSection={activeSection}
          activeBar={activeBar}
        />
      )}
    </div>
  );
}
