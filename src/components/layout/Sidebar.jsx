import logo from "../../assets/logo512.webp";
import {
  House,
  Users,
  ListMusic,
  Heart,
  Clock,
  Wrench,
  Music2,
  BookOpen,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const navItems = [
  { id: "/", labelKey: "nav.home", icon: House },
  { id: "/songs", labelKey: "nav.songs", icon: Music2 },
  { id: "/charts", labelKey: "nav.charts", icon: BookOpen },
  { id: "/artists", labelKey: "nav.artists", icon: Users },
  { id: "/playlists", labelKey: "nav.playlists", icon: ListMusic },
  { id: "/favorites", labelKey: "nav.favorites", icon: Heart },
  { id: "/recents", labelKey: "nav.recents", icon: Clock },
  { id: "/settings", labelKey: "nav.settings", icon: Wrench },
];

export default function Sidebar() {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <div className="hidden md:flex flex-col h-screen w-[240px] lg:w-[19%] border-r sharqi-border bg-[#fffaf0]/92 shadow-2xl gap-5 p-5 shrink-0 backdrop-blur-sm">
      <div>
        <img
          src={logo}
          alt="Logo"
          width={200}
          height={200}
          className="mx-auto"
        />
        <p className="mt-[-22px] text-center font-ibm-plex text-2xl font-semibold text-[#9a6430]">
          عرب كوردز
        </p>
        <h1 className="text-2xl font-semibold text-center tracking-wide font-inter text-[#233f38]">
          arab <span className="text-[#b48a4a]">chords</span>
        </h1>
        <div className="w-[80%] h-0.5 bg-gradient-to-r from-[#1f766f] via-[#b48a4a] to-[#8f3e43] mx-auto mt-2 rounded-full"></div>
        <p className="text-xs text-[#6f6558] text-center mt-2 px-2 leading-snug">
          {t("sidebar.tagline")}
        </p>
      </div>

      <div className="flex flex-col gap-2 mt-7">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.id === "/songs"
              ? location.pathname === "/songs" || location.pathname.startsWith("/songs/")
              : item.id === "/charts"
              ? location.pathname === "/charts" || location.pathname.startsWith("/charts/")
              : location.pathname === item.id;

          return (
            <Link
              key={item.id}
              to={item.id}
              className={`flex font-medium text-lg w-[90%] mx-auto items-center gap-3 p-2.5 rounded-lg transition-all duration-200 ${isActive
                  ? "bg-[#b48a4a]/18 text-[#244a41] font-semibold shadow-sm"
                  : "text-[#5f6259] hover:bg-[#1f766f]/10 hover:text-[#244a41]"
                }`}
            >
              <Icon
                size={20}
                color={isActive ? "#9a6430" : "currentColor"}
                fill={isActive ? "#9a6430" : "none"}
                className="transition-all duration-200"
              />
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
