import { useEffect, useState } from "react";
import {
  Wrench, Globe, Palette, ChevronRight, Check, Volume2
} from "lucide-react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n/i18n.js";

const STORAGE_KEYS = {
  fontSize: "arab-chords-font-size",
  compactView: "arab-chords-compact-view",
};

function getStoredSetting(key, fallback) {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key) ?? fallback;
}

const LANGUAGE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "fr", label: "Français" },
];

const ToggleSwitch = ({ id, checked, onChange }) => (
  <button
    id={id}
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none ${checked ? "bg-[#5F7D66]" : "bg-gray-200"
      }`}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"
        }`}
    />
  </button>
);

const Section = ({ title, icon: Icon, iconBg, iconColor, children }) => (
  <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
      <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
        <Icon size={16} color={iconColor} />
      </div>
      <h3 className="font-bold text-gray-700 text-sm">{title}</h3>
    </div>
    <div className="divide-y divide-gray-50">{children}</div>
  </div>
);

const Row = ({ label, desc, children }) => (
  <div className="flex items-center justify-between gap-4 px-5 py-4">
    <div>
      <p className="text-sm font-medium text-gray-800">{label}</p>
      {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const SelectPill = ({ options, value, onChange }) => (
  <div className="flex gap-1 flex-wrap justify-end">
    {options.map((opt) => (
      <button
        key={opt.value}
        id={`select-${opt.value}`}
        onClick={() => onChange(opt.value)}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center gap-1 ${value === opt.value
            ? "bg-[#5F7D66] text-white shadow-sm"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
      >
        {value === opt.value && <Check size={11} />}
        {opt.label}
      </button>
    ))}
  </div>
);

export const Settings = () => {
  const { t } = useTranslation();
  const [currentLang, setCurrentLang] = useState(() => i18n.language || "en");
  const [fontSize, setFontSize] = useState(() => getStoredSetting(STORAGE_KEYS.fontSize, "medium"));
  const [compactView, setCompactView] = useState(() => getStoredSetting(STORAGE_KEYS.compactView, "false") === "true");

  useEffect(() => {
    const syncSettings = () => {
      setFontSize(getStoredSetting(STORAGE_KEYS.fontSize, "medium"));
      setCompactView(getStoredSetting(STORAGE_KEYS.compactView, "false") === "true");
    };

    syncSettings();
    window.addEventListener("settings-changed", syncSettings);
    return () => window.removeEventListener("settings-changed", syncSettings);
  }, []);

  const persistSetting = (key, value) => {
    window.localStorage.setItem(key, value);
    window.dispatchEvent(new Event("settings-changed"));
  };

  const handleLanguageChange = (code) => {
    setCurrentLang(code);
    i18n.changeLanguage(code);
    window.localStorage.setItem('arab-chords-lang', code);
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = code;
  };

  const handleFontSizeChange = (value) => {
    setFontSize(value);
    persistSetting(STORAGE_KEYS.fontSize, value);
  };

  const handleCompactViewChange = (value) => {
    setCompactView(value);
    persistSetting(STORAGE_KEYS.compactView, String(value));
  };

  const FONT_SIZES = [
    { value: "small", label: t('settings.appearance.fontSizes.small') },
    { value: "medium", label: t('settings.appearance.fontSizes.medium') },
    { value: "large", label: t('settings.appearance.fontSizes.large') },
  ];

  return (
    <div className="settings-page-shell p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center">
            <Wrench size={20} color="#374151" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 font-inter">{t('settings.title')}</h2>
        </div>
        <p className="text-gray-500 ml-[52px]">{t('settings.subtitle')}</p>
      </div>

      <div className="space-y-5">

        {/* Appearance */}
        <Section title={t('settings.appearance.title')} icon={Palette} iconBg="bg-violet-100" iconColor="#7c3aed">
          <Row label={t('settings.appearance.fontSize')} desc={t('settings.appearance.fontSizeDesc')}>
            <SelectPill options={FONT_SIZES} value={fontSize} onChange={handleFontSizeChange} />
          </Row>
          <Row label={t('settings.appearance.compactView')} desc={t('settings.appearance.compactViewDesc')}>
            <ToggleSwitch id="toggle-compact" checked={compactView} onChange={handleCompactViewChange} />
          </Row>
        </Section>


        {/* Language & Region */}
        <Section title={t('settings.language.title')} icon={Globe} iconBg="bg-sky-100" iconColor="#0284c7">
          <Row label={t('settings.language.label')} desc={t('settings.language.desc')}>
            <div className="flex gap-2 flex-wrap justify-end">
              {LANGUAGE_OPTIONS.map(({ code, label }) => (
                <button
                  key={code}
                  id={`lang-${code}`}
                  onClick={() => handleLanguageChange(code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center gap-1 ${currentLang === code
                      ? "bg-[#5F7D66] text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  {currentLang === code && <Check size={11} />}
                  {label}
                </button>
              ))}
            </div>
          </Row>
        </Section>

        {/* About */}
        <Section title={t('settings.about.title')} icon={Volume2} iconBg="bg-rose-100" iconColor="#e11d48">
          <Row label={t('settings.about.version')} desc="Arab Chords">
            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded-lg text-gray-600">v1.0.0</span>
          </Row>
          <div className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors">
            <p className="text-sm font-medium text-gray-800">{t('settings.about.privacy')}</p>
            <ChevronRight size={15} color="#9ca3af" />
          </div>
          <div className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors">
            <p className="text-sm font-medium text-gray-800">{t('settings.about.terms')}</p>
            <ChevronRight size={15} color="#9ca3af" />
          </div>
        </Section>

      </div>
    </div>
  );
};

export default Settings;
