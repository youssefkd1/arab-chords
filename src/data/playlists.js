export const PLAYLIST_COLORS = [
  "from-amber-400 to-orange-500",
  "from-violet-400 to-violet-600",
  "from-rose-400 to-pink-500",
  "from-[#5F7D66] to-[#3d5c45]",
  "from-indigo-400 to-blue-600",
  "from-teal-400 to-cyan-600",
  "from-fuchsia-400 to-pink-500",
  "from-sky-400 to-blue-500",
  "from-emerald-400 to-green-600",
];

export const DEFAULT_PLAYLISTS = [
  { id: 1, name: "Morning Oud", color: PLAYLIST_COLORS[0], imageUrl: null, songIds: [2, 6, 10] },
  { id: 2, name: "Fairouz Classics", color: PLAYLIST_COLORS[1], imageUrl: null, songIds: [2] },
  { id: 3, name: "80s Egyptian Pop", color: PLAYLIST_COLORS[2], imageUrl: null, songIds: [3] },
  { id: 4, name: "Beginner Picks", color: PLAYLIST_COLORS[3], imageUrl: null, songIds: [7, 8, 4] },
  { id: 5, name: "Late Night Vibes", color: PLAYLIST_COLORS[4], imageUrl: null, songIds: [5, 9] },
];
