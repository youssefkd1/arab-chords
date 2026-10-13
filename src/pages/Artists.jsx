import { useState } from "react";
import { Users, Search, Music2, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

const ARTISTS = [
  { id: 1, name: "Fairouz", country: "Lebanon", genre: "Classical Arabic", songs: 48, initials: "F", color: "from-violet-400 to-violet-600" },
  { id: 2, name: "Amr Diab", country: "Egypt", genre: "Pop / Shaabi", songs: 62, initials: "AD", color: "from-amber-400 to-orange-500" },
  { id: 3, name: "Abdel Halim Hafez", country: "Egypt", genre: "Golden Age", songs: 35, initials: "AH", color: "from-rose-400 to-pink-600" },
  { id: 4, name: "Marcel Khalife", country: "Lebanon", genre: "Protest / Oud", songs: 27, initials: "MK", color: "from-teal-400 to-cyan-600" },
  { id: 5, name: "Kadim Al Saher", country: "Iraq", genre: "Romantic Pop", songs: 41, initials: "KS", color: "from-[#5F7D66] to-[#3d5c45]" },
  { id: 6, name: "Nancy Ajram", country: "Lebanon", genre: "Pop", songs: 33, initials: "NA", color: "from-fuchsia-400 to-pink-500" },
  { id: 7, name: "Wael Kfoury", country: "Lebanon", genre: "Romantic", songs: 29, initials: "WK", color: "from-blue-400 to-indigo-500" },
  { id: 8, name: "Majida El Roumi", country: "Lebanon", genre: "Classical / Pop", songs: 22, initials: "MR", color: "from-emerald-400 to-green-600" },
  { id: 9, name: "Elissa", country: "Lebanon", genre: "Pop", songs: 38, initials: "E", color: "from-purple-400 to-violet-600" },
  { id: 10, name: "Fares Karam", country: "Lebanon", genre: "Shaabi / Dabke", songs: 19, initials: "FK", color: "from-red-400 to-rose-600" },
  { id: 11, name: "Umm Kulthum", country: "Egypt", genre: "Classical Arabic", songs: 44, initials: "UK", color: "from-yellow-400 to-amber-600" },
  { id: 12, name: "Mohamed Mounir", country: "Egypt", genre: "Pop / Folk", songs: 31, initials: "MM", color: "from-sky-400 to-blue-600" },
];

const COUNTRY_KEYS = ["All", "Lebanon", "Egypt", "Iraq"];

export const Artists = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("All");

  const countryLabel = (c) => {
    const map = {
      All: t('artists.countries.all'),
      Lebanon: t('artists.countries.lebanon'),
      Egypt: t('artists.countries.egypt'),
      Iraq: t('artists.countries.iraq'),
    };
    return map[c] ?? c;
  };

  const filtered = ARTISTS.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchCountry = selectedCountry === "All" || a.country === selectedCountry;
    return matchSearch && matchCountry;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <Users size={20} color="#7c3aed" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 font-inter">{t('artists.title')}</h2>
        </div>
        <p className="text-gray-500 ml-[52px]">{t('artists.subtitle')}</p>
      </div>

      {/* Search & Country Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="artists-search"
            type="text"
            placeholder={t('artists.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all duration-200"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {COUNTRY_KEYS.map((c) => (
            <button
              key={c}
              id={`country-filter-${c}`}
              onClick={() => setSelectedCountry(c)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${selectedCountry === c
                  ? "bg-violet-600 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-700"
                }`}
            >
              {countryLabel(c)}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-4">
        {t('artists.count', { count: filtered.length })}
      </p>

      {/* Artists Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">{t('artists.noArtistsTitle')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((artist) => (
            <div
              key={artist.id}
              id={`artist-card-${artist.id}`}
              className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-lg hover:border-violet-200 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${artist.color} flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0`}>
                  {artist.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 truncate">{artist.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{countryLabel(artist.country)}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-violet-400 group-hover:translate-x-1 transition-all duration-200 shrink-0" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">{artist.genre}</span>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Music2 size={12} />
                  <span>{artist.songs} {t('artists.songs')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Artists;
