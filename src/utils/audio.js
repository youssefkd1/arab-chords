/**
 * Arab Chords Audio Engine
 * - Piano: Tone.Sampler → Salamander Grand Piano
 * - Drums: Tone.Player (individual) → CR78 real samples from tonejs.github.io
 */
import * as Tone from "tone";

const instrumentVolumes = {
  drums: 0,
  piano: 0,
  bass: 0,
};

function applyInstrumentVolume(name, db) {
  if (name === "drums") {
    if (drumBus) drumBus.volume.value = -3 + db;
    return;
  }

  if (name === "piano") {
    if (keyboardVolume) {
      keyboardVolume.volume.value = db;
    }
    return;
  }

  if (name === "bass") {
    if (bassSynth) {
      bassSynth.volume.value = -11 + db;
    }
  }
}

// ─── Chord-to-Notes ───────────────────────────────────────────────────────────
const CHORD_INTERVALS = {
  "": [0, 4, 7],
  "m": [0, 3, 7],
  "7": [0, 4, 7, 10],
  "maj7": [0, 4, 7, 11],
  "M7": [0, 4, 7, 11],
  "Δ7": [0, 4, 7, 11],
  "m7": [0, 3, 7, 10],
  "-7": [0, 3, 7, 10],
  "m7b5": [0, 3, 6, 10],
  "m7(b5)": [0, 3, 6, 10],
  "m7-5": [0, 3, 6, 10],
  "ø": [0, 3, 6, 10],
  "7#11": [0, 4, 7, 10, 18],
  "7b5": [0, 4, 6, 10],
  "7b9": [0, 4, 7, 10, 13],
  "7b9b5": [0, 4, 6, 10, 13],
  "dim": [0, 3, 6],
  "aug": [0, 4, 8],
  "sus2": [0, 2, 7],
  "sus4": [0, 5, 7],
  "add9": [0, 4, 7, 14],
  "6": [0, 4, 7, 9],
  "m6": [0, 3, 7, 9],
  "9": [0, 4, 7, 10, 14],
  "5": [0, 7],
};

const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const ALIASES = {
  Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#",
  Cb: "B", Fb: "E", "B#": "C", "E#": "F",
};

function chordToNotes(chordText, octave = 3) {
  if (!chordText || chordText === "%" || chordText === "-") return [];
  const match = chordText.match(/^([A-G][b#]?)(.*)$/);
  if (!match) return [];
  const rawRoot = match[1];
  const quality = match[2].trim();
  const root = ALIASES[rawRoot] ?? rawRoot;
  const rootIndex = CHROMATIC.indexOf(root);
  if (rootIndex === -1) return [];
  const intervals = CHORD_INTERVALS[quality] ?? CHORD_INTERVALS[""];
  return intervals.map((semitones) => {
    const noteIndex = (rootIndex + semitones) % 12;
    const noteOctave = octave + Math.floor((rootIndex + semitones) / 12);
    return `${CHROMATIC[noteIndex]}${noteOctave}`;
  });
}

// ─── Piano (Salamander Grand) ─────────────────────────────────────────────────
const SALAMANDER_BASE = "https://tonejs.github.io/audio/salamander/";
const PIANO_NOTES = [
  "A0", "C1", "D#1", "F#1", "A1", "C2", "D#2", "F#2",
  "A2", "C3", "D#3", "F#3", "A3", "C4", "D#4", "F#4",
  "A4", "C5", "D#5", "F#5", "A5", "C6", "D#6", "F#6",
  "A6", "C7", "D#7", "F#7", "A7",
];

let sampler = null;
let samplerReady = false;
let samplerLoading = false;
let bassSynth = null;
let keyboardVolume = null;
let keyboardFilter = null;
let keyboardCompressor = null;
let keyboardLimiter = null;
let drumBus = null;
let bassFilter = null;
let bassDrive = null;
let bassCompressor = null;

function getKeyboardOutput() {
  if (keyboardVolume) return keyboardVolume;

  keyboardVolume = new Tone.Volume(instrumentVolumes.piano);
  keyboardFilter = new Tone.Filter({
    type: "highpass",
    frequency: 260,
    rolloff: -12,
  });
  keyboardCompressor = new Tone.Compressor({
    threshold: -14,
    ratio: 1.8,
    attack: 0.004,
    release: 0.09,
    knee: 8,
  });
  keyboardLimiter = new Tone.Limiter(-2);

  keyboardVolume.chain(keyboardFilter, keyboardCompressor, keyboardLimiter, Tone.Destination);
  return keyboardVolume;
}

async function getSampler() {
  if (sampler && samplerReady) return sampler;
  if (samplerLoading) { await Tone.loaded(); return sampler; }
  samplerLoading = true;
  const urls = {};
  for (const note of PIANO_NOTES) {
    urls[note] = `${note.replace("#", "s")}.mp3`;
  }
  sampler = new Tone.Sampler({
    urls, baseUrl: SALAMANDER_BASE,
    onload: () => { samplerReady = true; },
    attack: 0.004,
    release: 0.12,
  }).connect(getKeyboardOutput());
  sampler.volume.value = -6;
  keyboardVolume.volume.value = instrumentVolumes.piano;
  await Tone.loaded();
  samplerReady = true;
  return sampler;
}

// ─── Drum Players (individual Tone.Player per sound) ─────────────────────────
// Using confirmed-working CR78 samples from tonejs.github.io
const CR78 = "https://tonejs.github.io/audio/drum-samples/CR78/";

// We keep separate Player instances per velocity tier to avoid per-step volume hacks
const drums = {
  kickHard: null,   // Full DUM  — vol: -1 dB
  kickGhost: null,  // Ghost DUM — vol: -18 dB
  snare: null,      // TAK / rimshot — vol: -2 dB
  hhSoft: null,     // Hi-hat weak (off-beat "and") — vol: -22 dB
  hhHard: null,     // Hi-hat strong (on-beat accent) — vol: -12 dB
};

let drumsLoading = false;
let drumsReady = false;

async function loadDrums() {
  if (drumsReady) return;
  if (drumsLoading) { await Tone.loaded(); return; }
  drumsLoading = true;
  drumBus = new Tone.Volume(-3 + instrumentVolumes.drums).toDestination();

  // kickHard — strong bass doum
  drums.kickHard = new Tone.Player(CR78 + "kick.mp3").connect(drumBus);
  drums.kickHard.volume.value = -1;

  // kickGhost — quiet ghost doum
  drums.kickGhost = new Tone.Player(CR78 + "kick.mp3").connect(drumBus);
  drums.kickGhost.volume.value = -18;

  // snare — used as rimshot / TAK
  drums.snare = new Tone.Player(CR78 + "snare.mp3").connect(drumBus);
  drums.snare.volume.value = -2;

  // hhSoft — weak "and" hi-hat (off-beat)
  drums.hhSoft = new Tone.Player(CR78 + "hihat.mp3").connect(drumBus);
  drums.hhSoft.volume.value = -22;

  // hhHard — strong on-beat hi-hat accent
  drums.hhHard = new Tone.Player(CR78 + "hihat.mp3").connect(drumBus);
  drums.hhHard.volume.value = -12;

  await Tone.loaded();
  drumsReady = true;
}

// ─── Maqsoum Groove (16-step, 16th-note grid) ────────────────────────────────
//
// A proper Maqsoum groove in 16 sixteenth-note steps:
//
//  Step:  1    2    3    4  | 5    6    7    8  | 9   10   11   12 | 13   14   15   16
//  KICK:  D    ·    g    ·  | ·    ·    g    ·  | D    D    ·    g | ·    ·    g    ·
//  TAK:   ·    ·    ·    ·  | T    ·    ·    ·  | ·    ·    ·    · | T    ·    ·    ·
//  HH:    ·    h    ·    h  | ·    h    ·    h  | ·    h    ·    h | ·    h    ·    h
//
//  D = kickHard, T = snare, g = kickGhost, h = hhSoft

// "K" = full kick, "G" = ghost kick, "T" = TAK (snare), "H" = hi-hat, null = rest
const MAQSOUM_DRUM_VARIATIONS = {
  maqsoum1: [
    { k: "K", t: null, h: "H" },
    { k: null, t: null, h: null },
    { k: null, t: "T", h: "H" },
    { k: null, t: null, h: null },
    { k: null, t: null, h: "H" },
    { k: null, t: null, h: null },
    { k: null, t: "T", h: "H" },
    { k: null, t: null, h: null },
    { k: "K", t: null, h: "H" },
    { k: null, t: null, h: null },
    { k: null, t: null, h: "H" },
    { k: null, t: null, h: null },
    { k: null, t: "T", h: "H" },
    { k: null, t: null, h: null },
    { k: "G", t: null, h: "H" },
    { k: null, t: null, h: null },
  ],
  maqsoum2: [
    { k: "K", t: null, h: "H" },
    { k: null, t: null, h: null },
    { k: null, t: "T", h: "H" },
    { k: null, t: null, h: null },
    { k: null, t: null, h: "H" },
    { k: "G", t: null, h: null },
    { k: null, t: "T", h: "H" },
    { k: null, t: null, h: null },
    { k: "K", t: null, h: "H" },
    { k: null, t: null, h: null },
    { k: null, t: null, h: "H" },
    { k: "G", t: null, h: null },
    { k: null, t: "T", h: "H" },
    { k: null, t: null, h: null },
    { k: "G", t: null, h: "H" },
    { k: null, t: null, h: null },
  ],
};

// ─── Bossa Nova Groove (16-step, 16th-note grid) ─────────────────────────────
//
// Authentic 2-3 rimshot (cross-stick) pattern + 8th-note hi-hats
// with alternating strong (H) and weak (h) accents + samba-style kicks.
//
//  Step:  1    2    3    4  | 5    6    7    8  | 9   10   11   12 | 13   14   15   16
//  KICK:  K    ·    ·    ·  | ·    ·    K    ·  | K    ·    ·    · | ·    ·    ·    ·
//  RIM:   ·    ·    ·    ·  | T    ·    ·    ·  | T    ·    ·    · | ·    ·    ·    ·
//  HH:    H    ·    h    ·  | H    ·    h    ·  | H    ·    h    · | H    ·    h    ·
//  
//  K = kickHard, T = snare (rimshot), H = hhHard (strong), h = hhSoft (weak)

// "K" = kick, "T" = rimshot, "H" = strong hi-hat, "h" = weak hi-hat, null = rest
const BOSSA_16 = [
  { k: "K",  t: "T", h: "H" },  //  1: beat 1   — kick + strong HH
  { k: null , t: null, h: null }, //  2
  { k: null, t: null, h: "h" },  //  3: and of 1 — weak HH
  { k: null, t: null, h: null }, //  4
  { k: null, t: null,  h: "H" },  //  5: beat 2   — rimshot (2-3) + strong HH
  { k: null, t: null, h: null }, //  6
  { k: "K",  t: "T", h: "h" },  //  7: and of 2 — kick + weak HH
  { k: null, t: null, h: null }, //  8
  { k: "K",  t: null,  h: "H" },  //  9: beat 3   — kick + rimshot (2-3) + strong HH
  { k: null, t: null, h: null }, // 10
  { k: null, t: null, h: "h" },  // 11: and of 3 — weak HH
  { k: null, t: null, h: null }, // 12
  { k: null, t: "T", h: "H" },  // 13: beat 4   — strong HH
  { k: null, t: null, h: null }, // 14
  { k: "K", t: null, h: "h" },  // 15: and of 4 — weak HH
  { k: null, t: null, h: null }, // 16

  { k: "K",  t: null, h: "H" },  //  1: beat 1   — kick + strong HH
  { k: null , t: null, h: null }, //  2
  { k: null, t: null, h: "h" },  //  3: and of 1 — weak HH
  { k: null, t: null, h: null }, //  4
  { k: null, t: "T",  h: "H" },  //  5: beat 2   — rimshot (2-3) + strong HH
  { k: null, t: null, h: null }, //  6
  { k: "K",  t: null, h: "h" },  //  7: and of 2 — kick + weak HH
  { k: null, t: null, h: null }, //  8
  { k: "K",  t: null,  h: "H" },  //  9: beat 3   — kick + rimshot (2-3) + strong HH
  { k: null, t: null, h: null }, // 10
  { k: null, t: "T", h: "h" },  // 11: and of 3 — weak HH
  { k: null, t: null, h: null }, // 12
  { k: null, t: null, h: "H" },  // 13: beat 4   — strong HH
  { k: null, t: null, h: null }, // 14
  { k: "K", t: null, h: "h" },  // 15: and of 4 — weak HH
  { k: null, t: null, h: null }, // 16
];

function normalizeMaqsoumVariation(variation) {
  if (variation === "maqsoum2" || variation === "maqsoom2") return "maqsoum2";
  return "maqsoum1";
}

let rhythmSequence = null;
let countInSynth = null;

function getCountInSynth() {
  if (countInSynth) return countInSynth;
  countInSynth = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.002, decay: 0.04, sustain: 0, release: 0.025 },
  }).toDestination();
  countInSynth.volume.value = -14;
  return countInSynth;
}

function getBassSynth() {
  if (bassSynth) return bassSynth;
  bassFilter = new Tone.Filter({
    type: "lowpass",
    frequency: 1150,
    rolloff: -24,
    Q: 0.6,
  });
  bassDrive = new Tone.Distortion(0.12);
  bassDrive.wet.value = 0.18;
  bassCompressor = new Tone.Compressor({
    threshold: -22,
    ratio: 3.5,
    attack: 0.006,
    release: 0.11,
    knee: 4,
  });
  bassSynth = new Tone.MonoSynth({
    oscillator: { type: "sawtooth" },
    filter: {
      type: "lowpass",
      frequency: 950,
      rolloff: -24,
      Q: 1.2,
    },
    envelope: { attack: 0.004, decay: 0.16, sustain: 0.18, release: 0.07 },
    filterEnvelope: {
      attack: 0.003,
      decay: 0.08,
      sustain: 0.18,
      release: 0.04,
      baseFrequency: 110,
      octaves: 2.4,
    },
  }).chain(bassFilter, bassDrive, bassCompressor, Tone.Destination);
  bassSynth.volume.value = -11 + instrumentVolumes.bass;
  return bassSynth;
}

function startMaqsoum(variation) {
  if (rhythmSequence) { rhythmSequence.stop(); rhythmSequence.dispose(); rhythmSequence = null; }

  const drumPattern = MAQSOUM_DRUM_VARIATIONS[normalizeMaqsoumVariation(variation)];
  rhythmSequence = new Tone.Sequence(
    (time, step) => {
      if (!step) return;
      if (step.k === "K" && drums.kickHard) drums.kickHard.start(time);
      if (step.k === "G" && drums.kickGhost) drums.kickGhost.start(time);
      if (step.t === "T" && drums.snare) drums.snare.start(time);
      if (step.h === "H" && drums.hhSoft) drums.hhSoft.start(time);
    },
    drumPattern,
    "16n"
  );
  rhythmSequence.loop = true;
  rhythmSequence.start(0);
}

function startBossaNova() {
  if (rhythmSequence) { rhythmSequence.stop(); rhythmSequence.dispose(); rhythmSequence = null; }

  rhythmSequence = new Tone.Sequence(
    (time, step) => {
      if (!step) return;
      if (step.k === "K" && drums.kickHard)  drums.kickHard.start(time);
      if (step.k === "G" && drums.kickGhost) drums.kickGhost.start(time);
      if (step.t === "T" && drums.snare)     drums.snare.start(time);
      if (step.h === "H" && drums.hhHard)    drums.hhHard.start(time);  // strong accent
      if (step.h === "h" && drums.hhSoft)    drums.hhSoft.start(time);  // weak accent
    },
    BOSSA_16,
    "16n"
  );
  rhythmSequence.loop = true;
  rhythmSequence.start(0);
}

function stopMaqsoum() {
  if (rhythmSequence) {
    rhythmSequence.stop();
    rhythmSequence.dispose();
    rhythmSequence = null;
  }
}

// ─── Playback State ────────────────────────────────────────────────────────────
let scheduledEvents = [];

function getRootMidiFromNotes(chordNotes) {
  if (!chordNotes || chordNotes.length === 0) return null;

  const rootNote = chordNotes[0];
  const match = rootNote.match(/([A-G]#?)(\d+)/);
  if (!match) return null;

  const noteName = match[1];
  const octave = Number(match[2]);
  const noteIndex = CHROMATIC.indexOf(noteName);
  if (noteIndex === -1) return null;

  return (octave + 1) * 12 + noteIndex - 12;
}

function buildMaqsoomBassGroove(rootMidi, barIndex, variation) {
  const fifth = rootMidi + 7;
  const fourth = rootMidi + 5;
  const approach = barIndex % 2 === 0 ? fifth : fourth;
  const grooves = {
    maqsoum1: [
      // Root on beat 1 — long anchor note
      { sixteenth: 0,  midi: rootMidi, duration: "4n",  velocity: 0.92 },
      // Root on beat 3
      { sixteenth: 8,  midi: rootMidi, duration: "8n",  velocity: 0.82 },
      // approach on beat & of 4
      { sixteenth: 14, midi: approach,    duration: "16n",  velocity: 0.58 },
    ],
    maqsoum2: [
      // Root on beat 1 — long anchor note
      { sixteenth: 0,  midi: rootMidi, duration: "4n",  velocity: 0.92 },
      // Root on beat 3
      { sixteenth: 8,  midi: rootMidi, duration: "8n",  velocity: 0.82 },
      // approach on beat & of 4
      { sixteenth: 14, midi: approach,    duration: "16n",  velocity: 0.58 },
    ],
  };

  return grooves[normalizeMaqsoumVariation(variation)];
}

function scheduleMaqsoomBass(bass, chordNotes, barIndex, variation) {
  const rootMidi = getRootMidiFromNotes(chordNotes);
  if (rootMidi === null) return;

  buildMaqsoomBassGroove(rootMidi, barIndex, variation).forEach(({ sixteenth, midi, duration, velocity }) => {
    const beat = Math.floor(sixteenth / 4);
    const subdivision = sixteenth % 4;
    const time = `${barIndex}:${beat}:${subdivision}`;
    const id = Tone.Transport.scheduleOnce((audioTime) => {
      bass.triggerAttackRelease(Tone.Frequency(midi, "midi"), duration, audioTime, velocity);
    }, time);
    scheduledEvents.push(id);
  });
}

function scheduleBossaBass(bass, chordNotes, barIndex) {
  const rootMidi = getRootMidiFromNotes(chordNotes);
  if (rootMidi === null) return;

  [
    { beat: 0, midi: rootMidi, duration: "8n", velocity: 0.82 },
    { beat: 1, midi: rootMidi + 7, duration: "8n", velocity: 0.62 },
    { beat: 2, midi: rootMidi, duration: "8n", velocity: 0.78 },
    { beat: 3, midi: rootMidi + 7, duration: "8n", velocity: 0.58 },
  ].forEach(({ beat, midi, duration, velocity }) => {
    const id = Tone.Transport.scheduleOnce((audioTime) => {
      bass.triggerAttackRelease(Tone.Frequency(midi, "midi"), duration, audioTime, velocity);
    }, `${barIndex}:${beat}:0`);
    scheduledEvents.push(id);
  });
}

function buildMaqsoomKeyboardVoicing(notes) {
  const root = notes[0];
  const third = notes[1] ?? notes[0];
  const fifth = notes[2] ?? notes[0];
  const color = notes[3];
  const chord = [third, fifth, color].filter(Boolean);
  const topLine = [root, third, fifth, color].filter(Boolean);

  return {
    root,
    chord,
    full: [root, ...chord],
    topLine,
  };
}

function buildBossaKeyboardVoicing(notes) {
  const root = notes[0];
  const upperNotes = notes.slice(1, 5);
  const chord = upperNotes.length > 0 ? upperNotes : notes;

  return {
    root,
    chord,
    full: [root, ...chord],
  };
}

function scheduleBossaPiano(piano, notes, barIndex, sIdx, bIdx, draw, onBarChange, patternIndex) {
  if (!notes || notes.length === 0) return;

  const { chord, full } = buildBossaKeyboardVoicing(notes);

  // ── 2-bar bossa keyboard comping pattern ────────────────────────────────────
  //
  // Subdivide each bar into 8 eighth notes (1–8):
  //
  //   Bar 1:  1 . 3 . . 6 . 8      (hits on 8th notes 1, 3, 6, 8)
  //   Bar 2:  . 2 . . 5 . 7 .      (hits on 8th notes 2, 5, 7)
  //
  // Eighth note → Tone.js beat:sub mapping (4/4, 16th-note grid):
  //   8th 1 → 0:0 | 8th 2 → 0:2 | 8th 3 → 1:0 | 8th 4 → 1:2
  //   8th 5 → 2:0 | 8th 6 → 2:2 | 8th 7 → 3:0 | 8th 8 → 3:2
  //
  // patternIndex is a dedicated 0-based counter (not barIndex) so the
  // count-in bar offset doesn't corrupt the Bar 1 / Bar 2 alternation.
  const isBar1 = patternIndex % 2 === 0;
  const hits = isBar1
    ? [
        // 8th 1 — downbeat, full voicing
        { beat: 0, sub: 0, noteSet: full,  velocity: 0.36 },
        // 8th 3 — beat 2
        { beat: 1, sub: 0, noteSet: chord, velocity: 0.28 },
        // 8th 6 — "and" of 3, syncopated accent
        { beat: 2, sub: 2, noteSet: full,  velocity: 0.32 },
        // 8th 8 — "and" of 4, pickup into bar 2
        { beat: 3, sub: 2, noteSet: chord, velocity: 0.26 },
      ]
    : [
        // 8th 2 — "and" of 1, offbeat
        { beat: 0, sub: 2, noteSet: chord, velocity: 0.27 },
        // 8th 5 — beat 3
        { beat: 2, sub: 0, noteSet: full,  velocity: 0.31 },
        // 8th 7 — beat 4
        { beat: 3, sub: 0, noteSet: chord, velocity: 0.25 },
      ];

  hits.forEach(({ beat, sub, noteSet, velocity }) => {
    const id = Tone.Transport.scheduleOnce((audioTime) => {
      piano.triggerAttackRelease(noteSet, "8n", audioTime, velocity);
    }, `${barIndex}:${beat}:${sub}`);
    scheduledEvents.push(id);
  });

  const highlightId = Tone.Transport.scheduleOnce((audioTime) => {
    if (onBarChange) {
      draw.schedule(() => onBarChange(sIdx, bIdx), audioTime);
    }
  }, `${barIndex}:0:0`);
  scheduledEvents.push(highlightId);
}

function scheduleBossaChordBeat(piano, bass, notes, barIndex, chordBeat, sIdx, bIdx, draw, onBarChange, shouldHighlight) {
  if (!notes || notes.length === 0) return;


  const { chord, full } = buildBossaKeyboardVoicing(notes);

  // Each chord occupies one beat-slot; play two eighth notes per beat-slot
  // (on-beat and the "and") so the comping stays rhythmically full
  const onBeat  = chordBeat % 2 === 0 ? full  : chord;
  const andBeat = chordBeat % 2 === 0 ? chord : chord;
  const onVel   = chordBeat % 2 === 0 ? 0.32 : 0.26;
  const andVel  = chordBeat % 2 === 0 ? 0.22 : 0.20;

  [
    { beat: chordBeat, sub: 0, noteSet: onBeat,  velocity: onVel },
    { beat: chordBeat, sub: 2, noteSet: andBeat, velocity: andVel },
  ].forEach(({ beat, sub, noteSet, velocity }) => {
    const id = Tone.Transport.scheduleOnce((audioTime) => {
      piano.triggerAttackRelease(noteSet, "8n", audioTime, velocity);
    }, `${barIndex}:${beat}:${sub}`);
    scheduledEvents.push(id);
  });

  const rootMidi = getRootMidiFromNotes(notes);
  if (bass && rootMidi !== null) {
    const midi = chordBeat % 2 === 0 ? rootMidi : rootMidi + 7;
    const id = Tone.Transport.scheduleOnce((audioTime) => {
      bass.triggerAttackRelease(Tone.Frequency(midi, "midi"), "8n", audioTime, chordBeat % 2 === 0 ? 0.78 : 0.58);
    }, `${barIndex}:${chordBeat}:0`);
    scheduledEvents.push(id);
  }

  if (shouldHighlight) {
    const highlightId = Tone.Transport.scheduleOnce((audioTime) => {
      if (onBarChange) {
        draw.schedule(() => onBarChange(sIdx, bIdx), audioTime);
      }
    }, `${barIndex}:0:0`);
    scheduledEvents.push(highlightId);
  }
}

function buildMaqsoomKeyboardGroove(voice, variation) {
  const { root, chord, full, topLine } = voice;
  const arpeggio = [
    topLine[0],
    topLine[1] ?? topLine[0],
    topLine[2] ?? topLine[0],
    topLine[3] ?? topLine[1] ?? topLine[0],
  ];

  const grooves = {
    maqsoum1: [
      // 16th 1 — downbeat, full chord (long)
      { sixteenth: 2,  noteSet: full,  velocity: 0.30, duration: "8n"  },
      // 16th 3 — quick follow chord
      { sixteenth: 6,  noteSet: chord, velocity: 0.22, duration: "8n" },
      // 16th 5 — slightly longer mid hit
      { sixteenth: 12,  noteSet: full,  velocity: 0.26, duration: "8n"  },
    ],
    maqsoum2: [
      // same pattern as maqsoum1 — no arpeggio
      { sixteenth: 2,  noteSet: full,  velocity: 0.30, duration: "16n"  },
      { sixteenth: 5,  noteSet: chord, velocity: 0.22, duration: "16n"  },
      { sixteenth: 12, noteSet: full,  velocity: 0.26, duration: "4n" },
    ],
  };

  return grooves[normalizeMaqsoumVariation(variation)];
}

function playKeyboardHit(piano, noteSet, duration, audioTime, velocity, arpeggiate = false) {
  if (!arpeggiate) {
    piano.triggerAttackRelease(noteSet, duration, audioTime, velocity);
    return;
  }

  noteSet.forEach((note, index) => {
    piano.triggerAttackRelease(note, duration, audioTime + index * 0.018, velocity * Math.max(0.62, 1 - index * 0.07));
  });
}

function scheduleMaqsoomPiano(piano, notes, barIndex, sIdx, bIdx, draw, onBarChange, variation) {
  if (!notes || notes.length === 0) return;

  const barTime = `${barIndex}:0:0`;
  const voice = buildMaqsoomKeyboardVoicing(notes);
  const groove = buildMaqsoomKeyboardGroove(voice, variation).map((hit) => {
    const beat = Math.floor(hit.sixteenth / 4);
    const subdivision = hit.sixteenth % 4;
    return { ...hit, time: `${barIndex}:${beat}:${subdivision}` };
  });

  groove.forEach(({ time, noteSet, velocity, duration, arpeggiate }) => {
    const id = Tone.Transport.scheduleOnce((audioTime) => {
      playKeyboardHit(piano, noteSet, duration, audioTime, velocity, arpeggiate);
    }, time);
    scheduledEvents.push(id);
  });

  const highlightId = Tone.Transport.scheduleOnce((audioTime) => {
    if (onBarChange) {
      draw.schedule(() => onBarChange(sIdx, bIdx), audioTime);
    }
  }, barTime);
  scheduledEvents.push(highlightId);
}

function scheduleMaqsoomChordBeat(piano, bass, notes, barIndex, chordBeat, sIdx, bIdx, draw, onBarChange, shouldHighlight, variation) {
  if (!notes || notes.length === 0) return;

  const voice = buildMaqsoomKeyboardVoicing(notes);

  buildMaqsoomKeyboardGroove(voice, variation)
    .filter(({ sixteenth }) => Math.floor(sixteenth / 4) === chordBeat)
    .forEach(({ sixteenth, noteSet, velocity, duration, arpeggiate }) => {
      const subdivision = sixteenth % 4;
      const id = Tone.Transport.scheduleOnce((audioTime) => {
        playKeyboardHit(piano, noteSet, duration, audioTime, velocity, arpeggiate);
      }, `${barIndex}:${chordBeat}:${subdivision}`);
      scheduledEvents.push(id);
    });

  const rootMidi = getRootMidiFromNotes(notes);
  if (bass && rootMidi !== null) {
    buildMaqsoomBassGroove(rootMidi, barIndex, variation)
      .filter(({ sixteenth }) => Math.floor(sixteenth / 4) === chordBeat)
      .forEach(({ sixteenth, midi, duration, velocity }) => {
        const subdivision = sixteenth % 4;
        const id = Tone.Transport.scheduleOnce((audioTime) => {
          bass.triggerAttackRelease(Tone.Frequency(midi, "midi"), duration, audioTime, velocity);
        }, `${barIndex}:${chordBeat}:${subdivision}`);
        scheduledEvents.push(id);
      });
  }

  if (shouldHighlight) {
    const highlightId = Tone.Transport.scheduleOnce((audioTime) => {
      if (onBarChange) {
        draw.schedule(() => onBarChange(sIdx, bIdx), audioTime);
      }
    }, `${barIndex}:0:0`);
    scheduledEvents.push(highlightId);
  }
}

function scheduleChordQuarter(piano, bass, notes, barIndex, beat, sIdx, bIdx, draw, onBarChange, shouldHighlight) {
  if (!notes || notes.length === 0) return;

  const time = `${barIndex}:${beat}:0`;
  const lowNotes = notes.map((note) => note.replace(/(\d+)$/, (m) => String(Math.max(2, Number(m) - 1))));
  const root = lowNotes[0];
  const fifth = lowNotes[2] ?? lowNotes[0];
  const pianoNotes = [root, fifth];
  const duration = "8n";
  const velocity = beat % 2 === 0 ? 0.5 : 0.38;

  const pianoId = Tone.Transport.scheduleOnce((audioTime) => {
    piano.triggerAttackRelease(pianoNotes, duration, audioTime, velocity);
  }, time);
  scheduledEvents.push(pianoId);

  const bassMatch = root.match(/([A-G]#?)(\d+)/);
  if (bass && bassMatch) {
    const noteName = bassMatch[1];
    const octave = Number(bassMatch[2]);
    const noteIndex = CHROMATIC.indexOf(noteName);
    if (noteIndex !== -1) {
      const rootMidi = (octave + 1) * 12 + noteIndex - 12;
      const bassId = Tone.Transport.scheduleOnce((audioTime) => {
        bass.triggerAttackRelease(Tone.Frequency(rootMidi, "midi"), "8n", audioTime, 0.56);
      }, time);
      scheduledEvents.push(bassId);
    }
  }

  if (shouldHighlight) {
    const highlightId = Tone.Transport.scheduleOnce((audioTime) => {
      if (onBarChange) {
        draw.schedule(() => onBarChange(sIdx, bIdx), audioTime);
      }
    }, time);
    scheduledEvents.push(highlightId);
  }
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

/**
 * Play a song's iReal chart.
 * @param {Array}    sections    - iReal sections
 * @param {number}   tempo       - BPM
 * @param {number}   transpose   - Semitone offset
 * @param {string}   rhythm      - "maqsoum1" | "maqsoum2" | "maqsoum3" | "none"
 * @param {Object}   practice    - repeat and tempo-step settings
 * @param {Function} onBarChange - (sectionIdx, barIdx) callback for UI highlight
 * @param {Function} onRepeatChange - (repeatIndex, bpm) callback for practice status
 */
export async function playChart({ sections, tempo, transpose = 0, rhythm = "none", practice = {}, onBarChange, onRepeatChange }) {
  await Tone.start();

  const shouldUseMaqsoum = rhythm === "maqsoum" || rhythm === "maqsoom" || rhythm.startsWith("maqsoum") || rhythm.startsWith("maqsoom");
  const shouldUseBossa = rhythm === "bossa";
  const shouldUseRhythm = shouldUseMaqsoum || shouldUseBossa;
  const maqsoumVariation = normalizeMaqsoumVariation(rhythm);

  // Load both in parallel
  await Promise.all([
    getSampler(),
    shouldUseRhythm ? loadDrums() : Promise.resolve(),
  ]);

  const piano = sampler;
  const bass = getBassSynth();

  // Stop anything currently playing
  Tone.Transport.stop();
  Tone.Transport.cancel();
  scheduledEvents.forEach((id) => Tone.Transport.clear(id));
  scheduledEvents = [];
  stopMaqsoum();

  const baseTempo = tempo ?? 80;
  const practiceRepeats = Math.max(1, Number(practice.repeats ?? 1));
  const tempoStep = Math.max(0, Number(practice.tempoStep ?? 0));
  const maxTempo = Math.max(baseTempo, Number(practice.maxTempo ?? 200));

  Tone.Transport.bpm.value = baseTempo;
  const draw = Tone.getDraw();

  // Start drum groove loop (loops until Transport stops)
  if (shouldUseMaqsoum) {
    startMaqsoum(maqsoumVariation);
  } else if (shouldUseBossa) {
    startBossaNova();
  }

  const countInBars = 1;
  const beatsPerBar = 4;
  for (let beat = 0; beat < countInBars * beatsPerBar; beat++) {
    const bar = Math.floor(beat / beatsPerBar);
    const beatInBar = beat % beatsPerBar;
    const time = `${bar}:${beatInBar}:0`;
    const id = Tone.Transport.scheduleOnce((audioTime) => {
      const click = getCountInSynth();
      const accent = beat === 0;
      click.triggerAttackRelease(accent ? "C4" : "E4", "16n", audioTime, accent ? 0.48 : 0.26);
    }, time);
    scheduledEvents.push(id);
  }

  // Build ordered bar list respecting section repeats
  const sequence = [];
  sections.forEach((section, sIdx) => {
    const repeats = section.repeat ?? 1;
    for (let r = 0; r < repeats; r++) {
      section.bars.forEach((bar, bIdx) => {
        sequence.push({ sIdx, bIdx, chord: bar });
      });
    }
  });

  let measureOffset = countInBars;
  let bossaBarCount = 0; // separate counter so count-in bar doesn't shift the 2-bar pattern
  for (let repeatIndex = 0; repeatIndex < practiceRepeats; repeatIndex++) {
    const repeatTempo = Math.min(baseTempo + repeatIndex * tempoStep, maxTempo);
    const repeatStartId = Tone.Transport.scheduleOnce((audioTime) => {
      Tone.Transport.bpm.value = repeatTempo;
      if (onRepeatChange) {
        draw.schedule(() => onRepeatChange(repeatIndex, repeatTempo), audioTime);
      }
    }, `${measureOffset}:0:0`);
    scheduledEvents.push(repeatStartId);

    sequence.forEach(({ sIdx, bIdx, chord }) => {
      const barChords = getBarChords(chord);
      const isMultiChord = barChords.length > 1;

      if (shouldUseMaqsoum) {
        if (isMultiChord) {
          barChords.forEach((barChord, chordBeat) => {
            const notes = chordToNotes(transposeChordString(barChord, transpose), 3);
            if (notes.length > 0) {
              scheduleMaqsoomChordBeat(
                piano,
                bass,
                notes,
                measureOffset,
                chordBeat,
                sIdx,
                bIdx,
                draw,
                onBarChange,
                chordBeat === 0,
                maqsoumVariation
              );
            }
          });
        } else {
          const notes = chordToNotes(transposeChordString(barChords[0], transpose), 3);
          if (notes.length > 0) {
            scheduleMaqsoomPiano(piano, notes, measureOffset, sIdx, bIdx, draw, onBarChange, maqsoumVariation);
            scheduleMaqsoomBass(bass, notes, measureOffset, maqsoumVariation);
          }
        }
      } else if (shouldUseBossa) {
        if (isMultiChord) {
          barChords.forEach((barChord, chordBeat) => {
            const notes = chordToNotes(transposeChordString(barChord, transpose), 3);
            if (notes.length > 0) {
              scheduleBossaChordBeat(
                piano,
                bass,
                notes,
                measureOffset,
                chordBeat,
                sIdx,
                bIdx,
                draw,
                onBarChange,
                chordBeat === 0
              );
            }
          });
          bossaBarCount++;
        } else {
          const notes = chordToNotes(transposeChordString(barChords[0], transpose), 3);
          if (notes.length > 0) {
            scheduleBossaPiano(piano, notes, measureOffset, sIdx, bIdx, draw, onBarChange, bossaBarCount);
            scheduleBossaBass(bass, notes, measureOffset);
          }
          bossaBarCount++;
        }
      } else {
        if (isMultiChord) {
          barChords.forEach((barChord, chordBeat) => {
            const notes = chordToNotes(transposeChordString(barChord, transpose), 3);
            if (notes.length > 0) {
              scheduleChordQuarter(
                piano,
                bass,
                notes,
                measureOffset,
                chordBeat,
                sIdx,
                bIdx,
                draw,
                onBarChange,
                chordBeat === 0
              );
            }
          });
        } else {
          const notes = chordToNotes(transposeChordString(barChords[0], transpose), 3);
          if (notes.length > 0) {
            const id = Tone.Transport.schedule((audioTime) => {
              piano.triggerAttackRelease(notes, "2n", audioTime, 0.48);
              if (onBarChange) {
                draw.schedule(() => onBarChange(sIdx, bIdx), audioTime);
              }
            }, `${measureOffset}:0:0`);
            scheduledEvents.push(id);
          }
        }
      }

      measureOffset++;
    });
  }

  // End-of-chart stop
  const stopId = Tone.Transport.schedule((audioTime) => {
    Tone.Transport.stop();
    stopMaqsoum();
    if (onBarChange) {
      draw.schedule(() => onBarChange(-1, -1), audioTime);
    }
  }, `${measureOffset}:0:0`);
  scheduledEvents.push(stopId);

  Tone.Transport.start("+0.1");
}

export function stopChart() {
  Tone.Transport.stop();
  Tone.Transport.cancel();
  scheduledEvents.forEach((id) => Tone.Transport.clear(id));
  scheduledEvents = [];
  stopMaqsoum();
}

export function isPlaying() {
  return Tone.Transport.state === "started";
}

export function setPlaybackTempo(bpm) {
  if (Tone.Transport.state === "started") {
    Tone.Transport.bpm.value = bpm;
  }
}

export function setInstrumentVolume(name, db) {
  instrumentVolumes[name] = Number(db);
  applyInstrumentVolume(name, Number(db));
}

function transposeChordString(chord, steps) {
  if (!chord || steps === 0) return chord;
  return chord.replace(/(^|[\s/()|])([A-G][b#]?)/g, (match, prefix, root) => {
    const normalized = ALIASES[root] ?? root;
    const index = CHROMATIC.indexOf(normalized);
    if (index === -1) return match;
    let newIndex = (index + steps) % 12;
    if (newIndex < 0) newIndex += 12;
    return prefix + CHROMATIC[newIndex];
  });
}
