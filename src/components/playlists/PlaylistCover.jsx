import { useRef } from "react";
import { Camera, ListMusic } from "lucide-react";
import { useTranslation } from "react-i18next";


export default function PlaylistCover({ color, imageUrl, onImageChange, size = "md", readOnly = false }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);

  const sizeClass = size === "sm" ? "w-10 h-10" : "w-12 h-12";
  const iconSize = size === "sm" ? 16 : 20;

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => onImageChange(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const content = (
    <>
      {imageUrl ? (
        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${color} flex items-center justify-center`}>
          <ListMusic size={iconSize} color="white" />
        </div>
      )}
      {!readOnly && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <Camera size={iconSize} color="white" />
        </div>
      )}
    </>
  );

  if (readOnly) {
    return (
      <div className={`${sizeClass} rounded-xl overflow-hidden shrink-0 relative`}>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        inputRef.current?.click();
      }}
      className={`${sizeClass} rounded-xl overflow-hidden shrink-0 relative group/cover cursor-pointer`}
      aria-label={t("playlists.changeCover")}
    >
      {content}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </button>
  );
}
