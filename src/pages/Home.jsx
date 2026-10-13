import { Link } from 'react-router-dom';
import { BookOpen, Music2, Users, ListMusic, Heart, TrendingUp, Star, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSongs } from "../context/SongsContext.jsx";

const FEATURED_IDS = [2, 8, 10, 6];

export const Home = () => {
  const { t } = useTranslation();
  const { songs } = useSongs();
  const featured = FEATURED_IDS.map((id) => songs.find((song) => song.id === id)).filter(Boolean);

  const STATS = [
    { label: t('home.stats.songs'), value: "1,200+", icon: Music2 },
    { label: t('home.stats.artists'), value: "340+", icon: Users },
    { label: t('home.stats.playlists'), value: "80+", icon: ListMusic },
  ];

  const QUICK_LINKS = [
    { to: "/songs", label: t('home.links.songs.label'), desc: t('home.links.songs.desc'), icon: Music2, color: "from-[#1f766f]/16 to-[#fffaf0]", iconColor: "#1f766f" },
    { to: "/artists", label: t('home.links.artists.label'), desc: t('home.links.artists.desc'), icon: Users, color: "from-[#b48a4a]/22 to-[#fffaf0]", iconColor: "#9a6430" },
    { to: "/playlists", label: t('home.links.playlists.label'), desc: t('home.links.playlists.desc'), icon: ListMusic, color: "from-[#8f3e43]/16 to-[#fffaf0]", iconColor: "#8f3e43" },
    { to: "/favorites", label: t('home.links.favorites.label'), desc: t('home.links.favorites.desc'), icon: Heart, color: "from-[#244a41]/16 to-[#fffaf0]", iconColor: "#244a41" },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-10">

      {/* Hero */}
      <div className="sharqi-panel relative rounded-3xl overflow-hidden p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-[0.18] pointer-events-none bg-[linear-gradient(135deg,_transparent_0_38%,_rgba(255,255,255,0.22)_38%_40%,_transparent_40%_58%,_rgba(255,255,255,0.16)_58%_60%,_transparent_60%)] bg-[length:28px_28px]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Star size={16} className="text-yellow-300" fill="#fde047" />
            <span className="text-sm font-medium text-white/80">{t('home.tagline')}</span>
          </div>
          <h1 className="text-4xl font-bold font-inter leading-tight mb-2">
            {t('home.heroTitle')}
          </h1>
          <p className="text-white/70 text-sm mb-6 max-w-sm">
            {t('home.heroDesc')}
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link to="/songs">
              <button id="hero-browse-songs" className="px-5 py-2.5 bg-[#fffaf0] text-[#244a41] font-semibold rounded-xl text-sm hover:bg-white transition-all duration-200 cursor-pointer flex items-center gap-2">
                <BookOpen size={15} /> {t('home.browseSongs')}
              </button>
            </Link>
            <Link to="/artists">
              <button id="hero-browse-artists" className="px-5 py-2.5 bg-[#9a6430]/35 border border-[#f6d38f]/45 text-white font-semibold rounded-xl text-sm hover:bg-[#9a6430]/50 transition-all duration-200 cursor-pointer flex items-center gap-2">
                <Users size={15} /> {t('nav.artists')}
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {STATS.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-[#fffaf0] rounded-2xl border sharqi-border p-4 shadow-sm text-center">
            <div className="w-9 h-9 rounded-xl bg-[#1f766f]/10 flex items-center justify-center mx-auto mb-2">
              <Icon size={18} color="#1f766f" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-[#6f6558] font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <TrendingUp size={18} color="#9a6430" /> {t('home.quickAccess')}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_LINKS.map(({ to, label, desc, icon: Icon, color, iconColor }) => (
            <Link key={to} to={to} id={`quick-link-${label.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className={`bg-gradient-to-br ${color} border sharqi-border rounded-2xl p-4 hover:shadow-md transition-all duration-200 group cursor-pointer`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center shadow-sm">
                    <Icon size={18} color={iconColor} />
                  </div>
                  <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
                <p className="font-bold text-gray-800 text-sm">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Songs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Star size={18} color="#9a6430" /> {t('home.featured')}
          </h2>
          <Link to="/songs">
            <span className="text-sm text-[#4F6755] font-medium hover:underline cursor-pointer">{t('common.seeAll')}</span>
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {featured.map((song) => (
            <Link
              key={song.id}
              to={`/songs/${song.slug ?? song.id}`}
              className="group flex items-center gap-4 bg-[#fffaf0] hover:bg-[#1f766f]/5 border sharqi-border hover:border-[#b48a4a]/45 rounded-2xl px-4 py-3 transition-all duration-200 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-[#b48a4a]/15 group-hover:bg-[#9a6430] flex items-center justify-center shrink-0 transition-all duration-200">
                <BookOpen size={14} className="text-[#9a6430] group-hover:text-white transition-colors duration-200" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{song.title}</p>
                <p className="text-xs text-gray-500 truncate">{song.artist}</p>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-[#1f766f]/10 text-[#1f766f] text-xs font-bold shrink-0">
                {song.key}
              </span>

            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
