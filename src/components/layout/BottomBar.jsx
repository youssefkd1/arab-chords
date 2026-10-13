import { Link, useLocation } from "react-router-dom";
import { navItems } from "./Sidebar";
import { useTranslation } from "react-i18next";

export default function BottomBar() {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden border-t sharqi-border bg-[#fffaf0]/95 shadow-lg z-50 backdrop-blur-sm">
      <div className="flex justify-around items-center h-16">
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
              className={`relative group flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all duration-200 ${isActive
                  ? "bg-[#b48a4a]/20 text-[#9a6430]"
                  : "text-[#6f6558] hover:text-[#244a41] hover:bg-[#1f766f]/10"
                }`}
            >
              <span className="absolute -top-8 scale-0 group-hover:scale-100 transition bg-gray-800 text-white text-xs rounded px-2 py-1">
                {t(item.labelKey)}
              </span>

              <Icon
                size={18}
                color={isActive ? "#9a6430" : "currentColor"}
                fill={
                  isActive &&
                    (item.id === "/" || item.id === "/favorites")
                    ? "#9a6430"
                    : "none"
                }
                className="transition-all duration-200"
              />

              <span
                className={`text-[10px] mt-0.5 font-medium ${isActive
                    ? "font-semibold text-[#9a6430]"
                    : "text-[#6f6558]"
                  }`}
              >
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
